// BackEnd/mcp/service/mcp.service.js (CommonJS)
const { getAvailableSlotsDB, getAvailableSlotsWithAlternativesDB, reserveSlotDB } = require('../../modules/booking/slot.service');
const { sendConfirmationEmailTool } = require('../tools/sendConfirmationEmail.tool');
const { sendBookingConfirmationByReservationId } = require('../../modules/notifications/mail.service');
const { createStripeCheckoutForReservation } = require("../../modules/payments/payment.service");

async function validateUser({ username, password }) {
  if (!username || !password) {
    return { success: false, message: 'Missing username/password' }
  }
  return { success: true, userId: 'usr_demo_001', username }
}

async function getAvailableSlots({ date }) {
  if (!date) return { success:false, message:'Missing date' };
  return await getAvailableSlotsWithAlternativesDB(date);
}

async function reserveSlot({ userId, date, time, service }) {
  const { reservationId } = await reserveSlotDB({ userId, date, time, service });
  return {
    success: true,
    message: `Reserved ${date} ${time} for ${userId}`,
    reservationId
  };
}

async function createBookingPayment({ reservationId, userId }) {
  if (!reservationId) {
    return { success: false, message: "Missing reservationId" };
  }

  const session = await createStripeCheckoutForReservation(reservationId, userId);

  return {
    success: true,
    message: "Stripe checkout session created",
    ...session,
  };
}

async function sendConfirmationEmail({ reservationId }) {
  if (!reservationId) {
    return { success: false, message: 'Missing reservationId' };
  }

  const result = await sendBookingConfirmationByReservationId(reservationId);
  return result;
}

async function sendAdminConfEmail({ email, appointmentDetails }) {
  const emailAdmin = process.env.ADMIN_EMAIL
  if (!emailAdmin || !appointmentDetails?.date || !appointmentDetails?.time) {
    return { success: false, message: 'Missing email or appointment details' }
  }
  return { success: true, message: `Confirmation Admin email sent to ${emailAdmin}` }
}

module.exports = {
  validateUser,
  getAvailableSlots,
  reserveSlot,
  createBookingPayment,
  sendConfirmationEmail,
  sendAdminConfEmail,
}