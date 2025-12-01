// BackEnd/routes/mcp.routes.js
const express = require("express");
const router = express.Router();

const mcpController = require("../mcp/controller/mcp.controller");
const runAgent = require("../mcp/langchain/runner");
const { streamAgent } = require("../mcp/langchain/stream.handler");

const requireAuth = require("../mcp/middlewares/requireAuth");
const validateBody = require("../mcp/middlewares/validateBody");
const validateSchema = require("../mcp/middlewares/validateSchema");
const mcpLimiter = require("../mcp/middlewares/rateLimit");
const requireToolPermission = require("../mcp/middlewares/requireToolPermission");
const { checkLlmQuota } = require("../mcp/middlewares/llmQuota");

router.get("/health", (req, res) => res.json({ ok: true }));
router.get("/", mcpController.getConfig);

router.get("/welcome", requireAuth, mcpLimiter, (req, res) => {
  const welcomeMessage = {
    role: "assistant",
    type: "button_response",
    message: "Bienvenue ! Je suis votre assistant de réservation. Que puis-je faire pour vous ?",
    disableInput: true,
    actions: [
      { id: "reserve", label: "🗓️ Réserver un créneau", value: { action: "show_calendar", step: "date_selection" }, style: "primary" },
      { id: "modify", label: "📞 Modifier", value: { action: "get_reservations", step: "modify_selection" }, style: "primary" },
      { id: "free_chat", label: "❓ Poser une question", value: { action: "free_chat", step: "free_chat" }, style: "secondary" },
      { id: "other_domains", label: "📋 Autres domaines →", value: { action: "show_domains", step: "domain_selection" }, style: "secondary" }
    ],
    context: { step: "main_menu", canGoBack: false }
  };
  
  return res.status(200).json({ success: true, data: welcomeMessage });
});

/**
 * Route principale pour l'agent LangChain
 */
router.post(
  "/agent",
  requireAuth,
  mcpLimiter,
  checkLlmQuota,
  async (req, res) => {
    try {
      const { messages } = req.body;
      const user = req.user;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          message: "Messages array is required",
        });
      }

      // Invoquer l'agent LangChain
      const result = await runAgent({ messages, user });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("[POST /agent] Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

/**
 * Route SSE pour streamer les réponses en temps réel
 * Mode: Server-Sent Events avec updates partiels
 */
router.post(
  "/agent/stream",
  requireAuth,
  mcpLimiter,
  checkLlmQuota,
  async (req, res) => {
    try {
      const { messages } = req.body;
      const user = req.user;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({
          success: false,
          message: "Messages array is required",
        });
      }

      // Invoquer le stream agent
      await streamAgent({ messages, user, res });
    } catch (error) {
      console.error("[POST /agent/stream] Error:", error);
      // SSE headers déjà envoyés, donc on ne peut que write
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      } else {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
        res.end();
      }
    }
  }
);

router.post(
  "/call",
  requireAuth,
  requireToolPermission,
  mcpLimiter,
  validateBody("tool"),
  validateSchema,
  mcpController.callTool
);

module.exports = router;