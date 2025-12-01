// BackEnd/mcp/middlewares/llmQuota.js
const User = require("../../modules/users/models/User");

const MAX_COST_CENTS_PER_MONTH = Number(
  process.env.LLM_MAX_COST_CENTS_PER_MONTH || "10"
);

const MAX_COST_CENTS_PER_DAY = Number(
  process.env.LLM_MAX_COST_CENTS_PER_DAY || "5"
);

function getMonthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getDayKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

async function checkLlmQuota(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized (no user)" });
    }

    const user = await User.findById(userId).select("llmUsage");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized (user not found)" });
    }

    const monthKey = getMonthKey();
    const dayKey = getDayKey();
    const usage = user.llmUsage || {};

    const monthlyCost = usage.estimatedCostCents || 0;
    const dailyCost =
      usage.dayKey === dayKey ? usage.dailyCostCents || 0 : 0;

    if (dailyCost >= MAX_COST_CENTS_PER_DAY) {
      return res.status(429).json({
        success: false,
        error:
          "Limite d’utilisation quotidienne de l’assistant atteinte. Réessaie demain.",
      });
    }

    if (usage.monthKey === monthKey && monthlyCost >= MAX_COST_CENTS_PER_MONTH) {
      return res.status(429).json({
        success: false,
        error:
          "Limite d’utilisation mensuelle de l’assistant atteinte. Réessaie plus tard ou contacte le support.",
      });
    }

    next();
  } catch (err) {
    console.error("[llmQuota] error:", err);
    return res.status(500).json({
      success: false,
      error: "Erreur interne de quota LLM.",
    });
  }
}

module.exports = { checkLlmQuota };