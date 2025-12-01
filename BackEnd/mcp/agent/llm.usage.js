// BackEnd/mcp/agent/llm.usage.js
const User = require("../../modules/users/models/User");

// o3-mini réel
const INPUT_COST_PER_1K = Number(process.env.O3M_INPUT_USD_PER_1K || "0.0011");
const OUTPUT_COST_PER_1K = Number(process.env.O3M_OUTPUT_USD_PER_1K || "0.0044");
const USD_EUR_RATE = Number(process.env.USD_EUR_RATE || "0.9");

function getMonthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}`;
}

function getDayKey(d = new Date()) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;
  }

  async function updateLlmUsage(userId, usage) {
    if (!userId || !usage) return null;
  
    const { prompt_tokens = 0, completion_tokens = 0 } = usage;
  
    const user = await User.findById(userId);
    if (!user) return null;
  
    const monthKey = getMonthKey();
    const dayKey = getDayKey();
  
    const u = user.llmUsage || {};
  
    if (!u.monthKey || u.monthKey !== monthKey) {
      u.monthKey = monthKey;
      u.calls = 0;
      u.inputTokens = 0;
      u.outputTokens = 0;
      u.estimatedCostCents = 0;
      u.costUsd = 0;
      u.costEur = 0;
    }
  
    if (!u.dayKey || u.dayKey !== dayKey) {
      u.dayKey = dayKey;
      u.dailyCalls = 0;
      u.dailyInputTokens = 0;
      u.dailyOutputTokens = 0;
      u.dailyCostCents = 0;
    }
  
    u.calls = (u.calls || 0) + 1;
    u.inputTokens = (u.inputTokens || 0) + prompt_tokens;
    u.outputTokens = (u.outputTokens || 0) + completion_tokens;
  
    u.dailyCalls = (u.dailyCalls || 0) + 1;
    u.dailyInputTokens = (u.dailyInputTokens || 0) + prompt_tokens;
    u.dailyOutputTokens = (u.dailyOutputTokens || 0) + completion_tokens;
  
    const costUsd =
      (prompt_tokens / 1000) * INPUT_COST_PER_1K +
      (completion_tokens / 1000) * OUTPUT_COST_PER_1K;
  
    const costCents = costUsd * 100;
  
    u.estimatedCostCents = (u.estimatedCostCents || 0) + costCents;
  
    const totalUsd = (u.estimatedCostCents || 0) / 100;
    u.costUsd = totalUsd;
    u.costEur = totalUsd * USD_EUR_RATE;
  
    u.dailyCostCents = (u.dailyCostCents || 0) + costCents;
  
    u.approxUsd = Number(u.costUsd.toFixed(4));
    u.approxEur = Number(u.costEur.toFixed(4));
  
    user.llmUsage = u;
    await user.save();
  
    console.log("[llm.usage] updated:", {
      monthKey: u.monthKey,
      dayKey: u.dayKey,
      calls: u.calls,
      dailyCalls: u.dailyCalls,
      inputTokens: u.inputTokens,
      outputTokens: u.outputTokens,
      dailyCostCents: u.dailyCostCents,
      estimatedCostCents: u.estimatedCostCents,
      approxUsd: u.approxUsd,
      approxEur: u.approxEur,
    });
  
    return u;
  }

module.exports = { updateLlmUsage };
