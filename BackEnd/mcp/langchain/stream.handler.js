// BackEnd/mcp/langchain/stream.handler.js
const { HumanMessage, AIMessage, SystemMessage, ToolMessage } = require("@langchain/core/messages");
const { createAgent } = require("./agent");
const { createToolsForUser } = require("./tools");
const { updateLlmUsage } = require("../agent/llm.usage");

/**
 * Stream agent responses via Server-Sent Events
 * @param {Object} params
 * @param {Array} params.messages - Message history
 * @param {Object} params.user - User info
 * @param {Object} params.res - Express response object
 */
async function streamAgent({ messages, user, res }) {
  try {
    const userId = user?.id;
    console.log("[streamAgent] Creating agent for userId:", userId);
    
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendSSEEvent = (eventType, data) => {
      res.write(`event: ${eventType}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendSSEEvent("start", { 
      message: "Agent en cours de traitement...",
      timestamp: new Date().toISOString()
    });

    // Create tools and agent
    const tools = createToolsForUser(userId);
    const { model, systemPrompt } = createAgent(tools);
    
    // Convert to LangChain messages
    const langchainMessages = [
      new SystemMessage(systemPrompt),
      ...messages.map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else if (msg.role === "assistant") {
          return new AIMessage(msg.content);
        }
        return msg;
      })
    ];

    console.log("[streamAgent] Invoking model (first call)...");
    
    let totalUsage = {
      prompt_tokens: 0,
      completion_tokens: 0,
    };

    // FIRST CALL: Check for tool calls
    const firstResponse = await model.invoke(langchainMessages);
    
    if (firstResponse.usage_metadata) {
      totalUsage.prompt_tokens += firstResponse.usage_metadata.input_tokens || 0;
      totalUsage.completion_tokens += firstResponse.usage_metadata.output_tokens || 0;
    }

    console.log("[streamAgent] First response received, checking for tool calls...");

    // No tool calls - stream response directly
    if (!firstResponse.tool_calls || firstResponse.tool_calls.length === 0) {
      console.log("[streamAgent] No tool calls, streaming direct response");
      
      if (firstResponse.content) {
        const chunkSize = 10;
        for (let i = 0; i < firstResponse.content.length; i += chunkSize) {
          const chunk = firstResponse.content.slice(i, i + chunkSize);
          sendSSEEvent("token", {
            delta: chunk,
            partial: firstResponse.content.slice(0, i + chunkSize),
            timestamp: new Date().toISOString()
          });
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (userId && (totalUsage.prompt_tokens > 0 || totalUsage.completion_tokens > 0)) {
        try {
          await updateLlmUsage(userId, totalUsage);
          console.log("[streamAgent] Usage updated:", totalUsage);
        } catch (e) {
          console.error("[streamAgent] updateLlmUsage error:", e);
        }
      }

      sendSSEEvent("complete", {
        message: firstResponse.content || "Done",
        usage: totalUsage,
        toolCalls: 0,
        timestamp: new Date().toISOString()
      });
      
      res.end();
      return;
    }

    // Has tool calls - execute them
    const toolCall = firstResponse.tool_calls[0];
    const toolName = toolCall.name;
    const toolArgs = toolCall.args;
    
    console.log("[streamAgent] Tool call detected:", toolName, toolArgs);

    sendSSEEvent("tool_call", {
      name: toolName,
      args: toolArgs,
      timestamp: new Date().toISOString()
    });

    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      sendSSEEvent("error", {
        message: `Erreur : l'outil '${toolName}' n'existe pas.`,
        timestamp: new Date().toISOString()
      });
      res.end();
      return;
    }

    // Execute tool
    const toolResultString = await tool.invoke(toolArgs);
    const toolResult = JSON.parse(toolResultString);
    
    console.log("[streamAgent] Tool executed, result:", toolResult);

    // SECOND CALL: Get response with tool result
    const messagesWithToolResult = [
      ...langchainMessages,
      firstResponse,
      new ToolMessage({
        content: toolResultString,
        tool_call_id: toolCall.id,
      }),
    ];

    console.log("[streamAgent] Streaming model (second call with tool result)...");
    
    let secondContent = "";
    let tokenCount = 0;

    // VRAI STREAMING: stream() retourne les tokens au fur et à mesure
    for await (const chunk of await model.stream(messagesWithToolResult)) {
      if (chunk.content) {
        const delta = chunk.content;
        secondContent += delta;
        tokenCount++;

        console.log(`[streamAgent] Token ${tokenCount}: "${delta}"`);

        // Envoyer chaque token au client en temps réel
        sendSSEEvent("token", {
          delta: delta,
          partial: secondContent,
          timestamp: new Date().toISOString()
        });

        // Petit délai pour espacer les tokens (laisse le temps au client de re-render)
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Mettre à jour usage si disponible
      if (chunk.usage_metadata) {
        totalUsage.prompt_tokens += chunk.usage_metadata.input_tokens || 0;
        totalUsage.completion_tokens += chunk.usage_metadata.output_tokens || 0;
      }
    }

    console.log("[streamAgent] Streaming complete, total tokens:", tokenCount);

    // Update usage
    if (userId && (totalUsage.prompt_tokens > 0 || totalUsage.completion_tokens > 0)) {
      try {
        const usageSummary = await updateLlmUsage(userId, totalUsage);
        console.log("[streamAgent] Final usage updated:", {
          prompt_tokens: totalUsage.prompt_tokens,
          completion_tokens: totalUsage.completion_tokens,
          costEur: usageSummary?.approxEur,
        });
      } catch (e) {
        console.error("[streamAgent] updateLlmUsage error:", e);
      }
    }

    sendSSEEvent("complete", {
      message: secondContent || "Done",
      usage: totalUsage,
      toolCalls: 1,
      timestamp: new Date().toISOString()
    });
    
    res.end();

  } catch (error) {
    console.error("[streamAgent] Error:", error);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ message: error.message, timestamp: new Date().toISOString() })}\n\n`);
    res.end();
  }
}

module.exports = {
  streamAgent,
};
