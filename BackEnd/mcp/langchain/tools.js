// BackEnd/mcp/langchain/tools.js
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const mcpService = require("../service/mcp.service");

/**
 * Factory function qui crée les tools avec le userId bind
 * @param {string} userId - ID de l'utilisateur connecté
 * @returns {Array} Array de tools LangChain
 */
function createToolsForUser(userId) {
  /**
   * Tool pour obtenir les créneaux disponibles
   */
  const getAvailableSlotsTool = new DynamicStructuredTool({
    name: "getAvailableSlots",
    description: "Obtenir les créneaux disponibles pour une date donnée. Utilise cette fonction chaque fois qu'un utilisateur demande des disponibilités.",
    schema: z.object({
      date: z.string().describe("Date au format YYYY-MM-DD"),
    }),
    func: async ({ date }) => {
      try {
        console.log("[getAvailableSlotsTool] Called with userId:", userId);
        const result = await mcpService.getAvailableSlots({ date, userId });
        return JSON.stringify(result);
      } catch (error) {
        console.error("[getAvailableSlotsTool] Error:", error);
        return JSON.stringify({
          success: false,
          message: `Erreur lors de la récupération des créneaux: ${error.message}`,
        });
      }
    },
  });

  /**
   * Tool pour réserver un créneau
   */
  const reserveSlotTool = new DynamicStructuredTool({
    name: "reserveSlot",
    description: "Réserver un créneau pour l'utilisateur connecté. Nécessite une date, une heure, et optionnellement un service.",
    schema: z.object({
      date: z.string().describe("Date de la réservation au format YYYY-MM-DD"),
      time: z.string().describe("Heure de la réservation au format HH:MM"),
      service: z.string().optional().describe("Type de service (optionnel)"),
    }),
    func: async ({ date, time, service }) => {
      try {
        console.log("[reserveSlotTool] Called with userId:", userId);
        
        if (!userId) {
          return JSON.stringify({
            success: false,
            message: "Utilisateur non authentifié",
          });
        }

        const result = await mcpService.reserveSlot({
          userId,
          date,
          time,
          service,
        });

        // Si la réservation réussit, créer automatiquement le paiement
        if (result.success && result.reservationId) {
          const paymentResult = await mcpService.createBookingPayment({
            reservationId: result.reservationId,
            userId,
          });
          
          return JSON.stringify({
            ...result,
            payment: paymentResult,
          });
        }

        return JSON.stringify(result);
      } catch (error) {
        console.error("[reserveSlotTool] Error:", error);
        return JSON.stringify({
          success: false,
          message: `Erreur lors de la réservation: ${error.message}`,
        });
      }
    },
  });

  /**
   * Tool pour envoyer un email de confirmation
   */
  const sendConfirmationEmailTool = new DynamicStructuredTool({
    name: "sendConfirmationEmail",
    description: "Envoyer un email de confirmation pour une réservation. Nécessite l'ID de la réservation.",
    schema: z.object({
      reservationId: z.string().describe("ID de la réservation"),
    }),
    func: async ({ reservationId }) => {
      try {
        console.log("[sendConfirmationEmailTool] Called with userId:", userId);
        const result = await mcpService.sendConfirmationEmail({ reservationId });
        return JSON.stringify(result);
      } catch (error) {
        console.error("[sendConfirmationEmailTool] Error:", error);
        return JSON.stringify({
          success: false,
          message: `Erreur lors de l'envoi de l'email: ${error.message}`,
        });
      }
    },
  });

  return [getAvailableSlotsTool, reserveSlotTool, sendConfirmationEmailTool];
}

module.exports = {
  createToolsForUser,
};