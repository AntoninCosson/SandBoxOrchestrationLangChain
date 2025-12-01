const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Domicile" },
    firstName: String,
    lastName: String,
    company: String,
    phone: String,
    line1: String,
    line2: String,
    postalCode: String,
    city: String,
    country: { type: String, default: "FR" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const ReservationRefSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reservation",
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
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, required: true }, // "HH:MM"
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
    },
    emailStatus: {
      type: String,
      enum: ["none", "sent", "error"],
      default: "none",
    },
    lastEmailAt: { type: Date, default: null },
    hasDeposit: { type: Boolean, default: false },
    depositAmount: { type: Number, default: 0 },
    depositCurrency: { type: String, default: "EUR" },
    service: { type: String, default: "General Consultation" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const llmUsageSchema = new mongoose.Schema(
  {
    monthKey: String,
    calls: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    estimatedCostCents: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },
    costEur: { type: Number, default: 0 },

    dayKey: String,
    dailyCalls: { type: Number, default: 0 },
    dailyInputTokens: { type: Number, default: 0 },
    dailyOutputTokens: { type: Number, default: 0 },
    dailyCostCents: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, trim: true },
    password: String,

    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: [true, "Email is required"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Invalid email address"],
    },

    refreshTokenHash: { type: String, default: null },
    bestScore: { type: Number, default: 0 },
    llmUsage: { type: llmUsageSchema, default: () => ({}) },
    cart: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],

    addresses: { type: [AddressSchema], default: [] },
    defaultAddressId: { type: Number },

    reservations: { type: [ReservationRefSchema], default: [] },

    role: {
      type: String,
      enum: ["user", "admin", "assistant"],
      default: "user",
    },
  },

  {
    timestamps: true,
    minimize: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);

module.exports = mongoose.model("users", userSchema);
