// BackEnd/mcp/langchain/agent.js
const { ChatOpenAI } = require("@langchain/openai");
const fs = require("fs");
const path = require("path");

// Charger le system prompt template (depuis /mcp/langchain directement)
const SYSTEM_PROMPT_TEMPLATE = fs.readFileSync(
  path.join(__dirname, "./system-prompt.txt"),
  "utf8"
);

/**
 * Injecte les dates dynamiques dans le system prompt
 * @returns {String} System prompt avec dates en cours injectées
 */
function getSystemPromptWithDates() {
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  const tomorrowISO = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const todayFormatted = now.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  const currentYear = now.getFullYear();
  const currentTime = now.toLocaleTimeString('fr-FR');

  // Remplacer les placeholders dans le template
  let prompt = SYSTEM_PROMPT_TEMPLATE
    .replace(/\$\{TODAY_ISO\}/g, todayISO)
    .replace(/\$\{TOMORROW_ISO\}/g, tomorrowISO)
    .replace(/\$\{TODAY_FORMATTED\}/g, todayFormatted)
    .replace(/\$\{CURRENT_YEAR\}/g, currentYear)
    .replace(/\$\{CURRENT_TIME\}/g, currentTime);

  return prompt;
}

/**
 * Crée une instance de l'agent LangChain (v1.0+ compatible)
 * Utilise ChatOpenAI avec bindTools (approche recommandée)
 * @param {Array} tools - Array de tools LangChain
 * @returns {Object} Model avec tools bind + system prompt dynamique
 */
function createAgent(tools) {
  // Initialiser le modèle LLM
  const model = new ChatOpenAI({
    model: "gpt-3.5-turbo", // Changé de gpt-4o-mini pour moins cher
    temperature: 0.3,
    maxTokens: 1000,
  });

  // Bind les tools au modèle
  const modelWithTools = model.bindTools(tools);

  // Injecter les dates dynamiques
  const systemPrompt = getSystemPromptWithDates();

  // console.log("[createAgent] Today:", new Date().toISOString().split('T')[0]);
  // console.log("[createAgent] Current year:", new Date().getFullYear());

  return {
    model: modelWithTools,
    systemPrompt: systemPrompt,
  };
}

module.exports = {
  createAgent,
};