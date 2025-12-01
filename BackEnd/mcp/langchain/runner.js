// BackEnd/mcp/langchain/runner.js
const { HumanMessage, AIMessage, SystemMessage, ToolMessage } = require("@langchain/core/messages");
const { createAgent } = require("./agent");
const { createToolsForUser } = require("./tools");
const { updateLlmUsage } = require("../agent/llm.usage");

/**
 * Fonction helper pour vérifier si on doit retourner des boutons
 */
function shouldReturnButtons(toolResult, toolName) {
  if (toolResult.actions && Array.isArray(toolResult.actions)) {
    return true;
  }
  
  if (toolName === 'getAvailableSlots' && toolResult.availableSlots?.length > 0) {
    return true;
  }
  
  return false;
}

/**
 * Formatte la réponse en boutons pour le frontend
 */
function formatButtonResponse(toolResult, toolName) {
  if (toolResult.actions) {
    return {
      role: "assistant",
      type: "button_response",
      message: toolResult.message,
      actions: toolResult.actions,
      disableInput: true,
      context: toolResult.context || {},
    };
  }
  
  // Format spécifique pour les slots
  if (toolName === 'getAvailableSlots') {
    return formatSlotsAsButtons(toolResult);
  }
  
  return toolResult;
}

/**
 * Formate les créneaux disponibles en boutons
 */
function formatSlotsAsButtons(toolResult) {
  const slots = toolResult.availableSlots || [];
  const date = toolResult.date || 'cette date';
  
  if (slots.length === 0) {
    return {
      role: "assistant",
      type: "button_response",
      message: `Aucun créneau disponible pour ${date}. Voulez-vous essayer une autre date ?`,
      disableInput: true,
      actions: [
        {
          id: "back",
          label: "← Choisir une autre date",
          value: { action: "back", step: "date_selection" },
          style: "secondary",
        },
      ],
      context: { step: "time_selection", selectedDate: date },
    };
  }
  
  return {
    role: "assistant",
    type: "button_response",
    message: `✨ Voici les créneaux disponibles pour ${date} :`,
    disableInput: true,
    actions: slots.map((time) => ({
      id: `slot_${time}`,
      label: `🕐 ${time}`,
      value: {
        action: "reserve_slot",
        date: date,
        time: time,
      },
      style: "primary",
      icon: "🕐",
    })).concat([
      {
        id: "back_to_dates",
        label: "← Choisir une autre date",
        value: { action: "back", step: "date_selection" },
        style: "secondary",
      },
    ]),
    context: {
      step: "time_selection",
      selectedDate: date,
    },
  };
}

/**
 * Runner principal avec ReAct pattern manuel (LangChain 1.0+ compatible)
 * @param {Object} params
 * @param {Array} params.messages - Historique des messages
 * @param {Object} params.user - Informations de l'utilisateur
 * @returns {Object} Réponse formatée
 */
async function runAgent({ messages, user }) {
  try {
    const userId = user?.id;
    console.log("[runAgent] Creating agent for userId:", userId);
    
    // Créer les tools avec le userId bind
    const tools = createToolsForUser(userId);
    const { model, systemPrompt } = createAgent(tools);
    
    // Convertir les messages en format LangChain avec system prompt
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

    // Premier appel : Le modèle décide d'appeler un tool ou de répondre
    console.log("[runAgent] Invoking model (first call)...");
    const firstResponse = await model.invoke(langchainMessages);
    
    // Extraire l'usage des tokens du premier appel
    let totalUsage = {
      prompt_tokens: firstResponse.usage_metadata?.input_tokens || 0,
      completion_tokens: firstResponse.usage_metadata?.output_tokens || 0,
    };

    console.log("[runAgent] First response received, checking for tool calls...");

    // Si pas de tool calls, retourner la réponse directement
    if (!firstResponse.tool_calls || firstResponse.tool_calls.length === 0) {
      console.log("[runAgent] No tool calls, returning direct response");
      
      // Update usage
      if (userId && (totalUsage.prompt_tokens > 0 || totalUsage.completion_tokens > 0)) {
        try {
          await updateLlmUsage(userId, totalUsage);
          console.log("[runAgent] LLM usage updated:", totalUsage);
        } catch (e) {
          console.error("[runAgent] updateLlmUsage error:", e);
        }
      }
      
      return {
        role: "assistant",
        content: firstResponse.content || "Je n'ai rien à ajouter pour le moment.",
      };
    }

    // Il y a un tool call, on l'exécute
    const toolCall = firstResponse.tool_calls[0];
    const toolName = toolCall.name;
    const toolArgs = toolCall.args;
    
    console.log("[runAgent] Tool call detected:", toolName, toolArgs);

    // Trouver le tool correspondant
    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      return {
        role: "assistant",
        content: `Erreur : l'outil '${toolName}' n'existe pas.`,
      };
    }

    // Exécuter le tool
    const toolResultString = await tool.invoke(toolArgs);
    const toolResult = JSON.parse(toolResultString);
    
    console.log("[runAgent] Tool executed, result:", toolResult);

    // Check si on doit retourner des boutons
    if (shouldReturnButtons(toolResult, toolName)) {
      console.log("[runAgent] Returning button response");
      
      // Update usage avant de retourner
      if (userId && (totalUsage.prompt_tokens > 0 || totalUsage.completion_tokens > 0)) {
        try {
          await updateLlmUsage(userId, totalUsage);
        } catch (e) {
          console.error("[runAgent] updateLlmUsage error:", e);
        }
      }
      
      return formatButtonResponse(toolResult, toolName);
    }

    // Sinon, on continue avec un deuxième appel au modèle
    // Ajouter le message du tool aux messages
    const messagesWithToolResult = [
      ...langchainMessages,
      firstResponse,
      new ToolMessage({
        content: toolResultString,
        tool_call_id: toolCall.id,
      }),
    ];

    // Deuxième appel : Le modèle génère la réponse finale
    console.log("[runAgent] Invoking model (second call with tool result)...");
    const secondResponse = await model.invoke(messagesWithToolResult);
    
    // Ajouter l'usage du deuxième appel
    if (secondResponse.usage_metadata) {
      totalUsage.prompt_tokens += secondResponse.usage_metadata.input_tokens || 0;
      totalUsage.completion_tokens += secondResponse.usage_metadata.output_tokens || 0;
    }

    // Update usage
    if (userId && (totalUsage.prompt_tokens > 0 || totalUsage.completion_tokens > 0)) {
      try {
        const usageSummary = await updateLlmUsage(userId, totalUsage);
        console.log("[runAgent] LLM usage updated:", {
          prompt_tokens: totalUsage.prompt_tokens,
          completion_tokens: totalUsage.completion_tokens,
          costEur: usageSummary?.approxEur,
        });
      } catch (e) {
        console.error("[runAgent] updateLlmUsage error:", e);
      }
    }

    return {
      role: "assistant",
      content: secondResponse.content || "La réservation a été traitée avec succès.",
    };
  } catch (error) {
    console.error("[runAgent] Error:", error);
    return {
      role: "assistant",
      content: `Une erreur est survenue lors du traitement de votre demande: ${error.message}`,
    };
  }
}

module.exports = runAgent;