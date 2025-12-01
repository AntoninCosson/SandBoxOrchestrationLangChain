// BackEnd/mcp/tools/sendConfirmationEmail.tool.js
const { sendBookingConfirmationByReservationId } = require("../../modules/notifications/mail.service");

async function sendConfirmationEmailTool(params, context) {
  console.log("[TOOL] sendConfirmationEmail called with:", params);
  console.log("[TOOL] context:", context);

  const { reservationId } = params || {};
  if (!reservationId) {
    return {
      success: false,
      message: "Missing reservationId",
    };
  }

  const result = await sendBookingConfirmationByReservationId(reservationId);

  console.log("[sendConfirmationEmail.tool] result from mail.service", result);
  return result;
}

module.exports = {
  sendConfirmationEmailTool,
};
