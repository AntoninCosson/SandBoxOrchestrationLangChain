// BackEnd/modules/payments/payment.service.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Reservation = require("../booking/models/Reservation");

function getBookingAmountCents(reservation) {
  if (
    typeof reservation?.depositAmount === "number" &&
    reservation.depositAmount > 0
  ) {
    return Math.round(reservation.depositAmount * 100); // euros -> centimes
  }

  const eur = Number(process.env.BOOKING_DEPOSIT_EUR || "50");
  const cents = Math.round(eur * 100);

  if (!Number.isFinite(cents) || cents <= 0) {
    throw new Error("Invalid booking amount configuration");
  }

  return cents;
}

async function createStripeCheckoutForReservation(reservationId, userId) {
  if (!reservationId) {
    throw new Error("Missing reservationId");
  }

  const reservation = await Reservation.findById(reservationId).lean();
  if (!reservation) {
    throw new Error("Reservation not found");
  }

  const amount = getBookingAmountCents(reservation);
  const currency = (reservation.depositCurrency || "eur").toLowerCase();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],

    line_items: [
      {
        price_data: {
          currency,
          unit_amount: amount, // centimes
          product_data: {
            name: `Réservation ${reservation.date} ${reservation.time}`,
          },
        },
        quantity: 1,
      },
    ],

    metadata: {
      type: "reservation",
      reservationId: reservationId.toString(),
      userId: userId ? String(userId) : undefined,
    },

    success_url: `${process.env.FRONT_URL}/payment/ReservationSuccess?reservationId=${reservationId}`,
    cancel_url: `${process.env.FRONT_URL}/payment/cancelled`,
  });

  return {
    success: true,
    sessionId: session.id,
    url: session.url,
    amount,
    currency,
  };
}

module.exports = {
  createStripeCheckoutForReservation,
};
