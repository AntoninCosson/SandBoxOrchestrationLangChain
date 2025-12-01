// BackEnd/routes/payments.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const User = require("../modules/users/models/User");
const { validateBody } = require("../middlewares/validateZod");
const {
  checkoutSchema,
} = require("../modules/payments/schemas/paymentSchemas");
// const Order = require('../models/orders'); // plus tard

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) console.warn("[Stripe] STRIPE_SECRET_KEY manquante");
const stripe = require("stripe")(stripeKey || "");

router.post(
  "/checkout",
  auth,
  validateBody(checkoutSchema),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate({
        path: "cart.productId",
        model: "product",
      });
      if (!user || !user.cart?.length) {
        return res.status(400).json({ success: false, error: "Panier vide" });
      }

      const line_items = user.cart.map(({ productId: p, quantity }) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: p.name,
            images: p.image ? [p.image] : [],
            metadata: { productId: String(p._id) },
          },
          unit_amount: Math.round((p.price || 0) * 100),
        },
        quantity: quantity || 1,
      }));

      const totalWeightGrams = user.cart.reduce(
        (sum, { productId: p, quantity }) =>
          sum + (p.weightGrams || 0) * (quantity || 1),
        0
      );

      const relayAmount = totalWeightGrams <= 500 ? 390 : 690;
      const homeAmount = totalWeightGrams <= 500 ? 690 : 990;

      const addr = req.body?.shipping || {};
      const email = (req.body.customer_email || "").trim() || undefined;
      const name =
        `${(req.body.firstName || "").trim()} ${(
          req.body.lastName || ""
        ).trim()}`.trim() || undefined;
      const phone = (req.body.phone || "").trim() || undefined;

      let customerId;
      try {
        if (email) {
          const search = await stripe.customers.search({
            query: `email:"${email}"`,
          });
          if (search.data[0]) customerId = search.data[0].id;
        }
        if (!customerId) {
          const customer = await stripe.customers.create({
            email,
            name,
            phone,
            address: {
              line1: addr.line1 || undefined,
              line2: addr.line2 || undefined,
              city: addr.city || undefined,
              postal_code: addr.postcode || undefined,
              country: (addr.country || "FR").toUpperCase(),
            },
            metadata: { userId: String(req.user.id) },
          });
          customerId = customer.id;
        } else {
          await stripe.customers.update(customerId, {
            name: name || undefined,
            phone: phone || undefined,
            address: {
              line1: addr.line1 || undefined,
              line2: addr.line2 || undefined,
              city: addr.city || undefined,
              postal_code: addr.postcode || undefined,
              country: (addr.country || "FR").toUpperCase(),
            },
          });
        }
      } catch (e) {
        console.warn("[Stripe] customer create/update skipped:", e.message);
      }

      const session = await stripe.checkout.sessions.create({
        metadata: { userId: String(req.user.id) },
        payment_method_types: ["card"],
        mode: "payment",
        line_items,

        customer: customerId,
        customer_email: email,

        shipping_address_collection: { allowed_countries: ["FR", "BE"] },
        phone_number_collection: { enabled: true },

        custom_fields: [
          {
            key: "delivery_notes",
            label: { type: "custom", custom: "Instructions de livraison" },
            type: "text",
            optional: true,
          },
        ],

        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: relayAmount, currency: "eur" },
              display_name: "Point relais",
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: homeAmount, currency: "eur" },
              display_name: "Domicile",
            },
          },
        ],

        success_url: `${process.env.FRONT_URL}/payment/Success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONT_URL}/payment/cancelled`,
      });

      return res.status(200).json({
        success: true,
        url: session.url,
        id: session.id,
      });
    } catch (e) {
      console.error("POST /payments/checkout", e);
      res.status(500).json({ success: false, error: e.message });
    }
  }
);

// GET recap
router.get("/session/:id", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id, {
      expand: ["line_items.data.price.product", "shipping_cost.shipping_rate"],
    });

    const items = (session.line_items?.data || []).map((it) => ({
      name: it.description,
      unit_amount:
        (it.amount_subtotal || 0) / Math.max(1, it.quantity || 1) / 100,
      quantity: it.quantity,
      subtotal: (it.amount_subtotal || 0) / 100,
    }));

    res.json({
      success: true,
      sessionId: session.id,
      currency: session.currency,
      amount_total: (session.amount_total || 0) / 100,
      amount_subtotal: (session.amount_subtotal || 0) / 100,
      shipping: session.shipping_cost
        ? (session.shipping_cost.amount_total || 0) / 100
        : 0,
      shipping_option:
        session.shipping_cost?.shipping_rate?.display_name || null,
      customer_email:
        session.customer_details?.email || session.customer_email || null,
      items,
    });
  } catch (e) {
    console.error("GET /payments/session/:id", e.message);
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
