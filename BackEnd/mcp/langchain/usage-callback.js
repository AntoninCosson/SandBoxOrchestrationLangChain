// BackEnd/mcp/langchain/usage-callback.js
const { BaseCallbackHandler } = require("@langchain/core/callbacks/base");

/**
 * Callback handler custom pour tracker l'usage des tokens LLM
 * Alternative robuste si les metadata ne sont pas dispo
 */
class UsageTrackingCallback extends BaseCallbackHandler {
  constructor() {
    super();
    this.totalUsage = {
      prompt_tokens: 0,
      completion_tokens: 0,
    };
  }

  /**
   * Appelé après chaque appel LLM
   */
  async handleLLMEnd(output) {
    try {
      // LangChain structure: output.llmOutput.tokenUsage
      const usage = output?.llmOutput?.tokenUsage;
      
      if (usage) {
        this.totalUsage.prompt_tokens += usage.promptTokens || 0;
        this.totalUsage.completion_tokens += usage.completionTokens || 0;
        
        console.log("[UsageTrackingCallback] LLM call tracked:", {
          prompt: usage.promptTokens || 0,
          completion: usage.completionTokens || 0,
          total_so_far: this.totalUsage.prompt_tokens + this.totalUsage.completion_tokens,
        });
      }
    } catch (error) {
      console.error("[UsageTrackingCallback] Error tracking usage:", error);
    }
  }

  /**
   * Récupère l'usage total
   */
  getTotalUsage() {
    return this.totalUsage;
  }

  /**
   * Reset l'usage (utile entre les appels)
   */
  reset() {
    this.totalUsage = {
      prompt_tokens: 0,
      completion_tokens: 0,
    };
  }
}

module.exports = { UsageTrackingCallback };