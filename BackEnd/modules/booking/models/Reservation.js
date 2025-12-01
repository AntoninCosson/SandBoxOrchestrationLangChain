// modules/booking/models/Reservation.js (CommonJS)
const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
    },
    emailStatus: {
      type: String,
      enum: ['none', 'sent', 'error'],
      default: 'none',
    },
    lastEmailAt: { type: Date, default: null },
    hasDeposit: { type: Boolean, default: false },
    depositAmount: { type: Number, default: 0 },
    depositCurrency: { type: String, default: "EUR" },
    service: { type: String, default: "General Consultation" },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "reservations" }
);

reservationSchema.index({ date: 1, time: 1 }, { unique: true });
reservationSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
