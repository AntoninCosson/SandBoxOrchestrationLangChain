// routes/stripeWebhook.js
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { sendMail } = require("../utils/mailer");
const User = require("../modules/users/models/User");

const { getOkapiRate } = require("../utils/okapi");

const {
  sendBookingConfirmationByReservationId,
} = require("../modules/notifications/mail.service");
const Reservation = require("../modules/booking/models/Reservation");

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        const sessionId = event.data.object.id;


        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: [
            "line_items",
            "line_items.data.price.product",
            "shipping_cost.shipping_rate",
          ],
        });

        // Resa by MCP

        const isReservation = session.metadata?.type === "reservation";
        const reservationId = session.metadata?.reservationId;

        if (isReservation && reservationId) {

          try {
            await Reservation.findByIdAndUpdate(reservationId, {
              status: "confirmed",
              hasDeposit: true,
              lastEmailAt: new Date(),
            });

            const mailResult = await sendBookingConfirmationByReservationId(
              reservationId
            );
          } catch (e) {
          }

          return res.json({ received: true, type: "reservation" });
        }

        // Shop
        const items = (session.line_items?.data || []).map((it) => ({
          name: it.description,
          quantity: it.quantity || 1,
          subtotal: (it.amount_subtotal || 0) / 100,
        }));

        const userId = session.metadata?.userId;
        if (userId) {
          try {
            await User.updateOne({ _id: userId }, { $set: { cart: [] } });
          } catch (e) {}
        } else if (session.customer_details?.email) {
          try {
            const user = await User.findOne({
              email: session.customer_details.email,
            });
            if (user) {
              user.cart = [];
              await user.save();
            }
          } catch (e) {}
        }

        const subtotal = (session.amount_subtotal || 0) / 100;
        const total = (session.amount_total || 0) / 100;
        const currency = (session.currency || "eur").toUpperCase();
        const shippingName =
          session.shipping_cost?.shipping_rate?.display_name || "—";
        const shippingAmount = session.shipping_cost
          ? (session.shipping_cost.amount_total || 0) / 100
          : 0;

        const rows = items
          .map(
            (it) => `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #eee">${
              it.name
            }</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">× ${
              it.quantity
            }</td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${it.subtotal.toFixed(
              2
            )} €</td>
          </tr>`
          )
          .join("");

        const html = `
          <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:640px;margin:auto">
            <h2>Merci pour votre commande 🎉</h2>
            <p>Votre paiement a été confirmé.</p>
            <table style="width:100%;border-collapse:collapse;margin:14px 0">
              <thead>
                <tr>
                  <th style="text-align:left;border-bottom:2px solid #000;padding:6px 8px">Article</th>
                  <th style="text-align:center;border-bottom:2px solid #000;padding:6px 8px">Qté</th>
                  <th style="text-align:right;border-bottom:2px solid #000;padding:6px 8px">Sous-total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="margin-top:8px">
              <div style="display:flex;justify-content:space-between"><span>Sous-total</span><b>${subtotal.toFixed(
                2
              )} ${currency}</b></div>
              <div style="display:flex;justify-content:space-between"><span>Livraison (${shippingName})</span><b>${shippingAmount.toFixed(
          2
        )} ${currency}</b></div>
              <div style="display:flex;justify-content:space-between;font-size:18px;margin-top:8px"><span>Total payé</span><b>${total.toFixed(
                2
              )} ${currency}</b></div>
            </div>
            <p style="font-size:12px;color:#666;margin-top:16px">Session : ${
              session.id
            }</p>
          </div>
        `;

        const buyer =
          session.customer_details?.email || process.env.ADMIN_EMAIL;

        try {
          const info = await sendMail({
            to: buyer,
            subject: "Votre commande — confirmation de paiement",
            html,
            text: `Merci pour votre commande. Total ${total.toFixed(
              2
            )} ${currency}.`,
          });
        } catch (e) {
        }

        if (
          session.customer_details?.email &&
          process.env.ADMIN_EMAIL &&
          process.env.ADMIN_EMAIL !== session.customer_details.email
        ) {
          try {
            const info2 = await sendMail({
              to: process.env.ADMIN_EMAIL,
              subject: `Nouvelle commande — ${total.toFixed(2)} ${currency}`,
              html,
              text: `Nouvelle commande. Total ${total.toFixed(2)} ${currency}.`,
            });
          } catch (e) {}
        }

        let groups = {};
        try {
          const userId = session.metadata?.userId;
          if (userId) {
            const user = await User.findById(userId).populate("cart.productId");
            const cart = user?.cart || [];

            for (const item of cart) {
              const cls = item.productId?.shipping?.shipping_class || "unknown";
              if (!groups[cls]) {
                groups[cls] = {
                  productCode:
                    item.productId?.shipping?.simtao_productCode || "GENERIC",
                  totalQty: 0,
                  totalWeight: 0,
                  avgWeight: 0,
                };
              }
              const qty = item.quantity || 0;
              const w = item.productId?.shipping?.weight_g || 0;
              groups[cls].totalQty += qty;
              groups[cls].totalWeight += w * qty;
            }
          } else {
            const lineItems = session.line_items?.data || [];
            for (const li of lineItems) {
              const cls =
                li.price?.product?.metadata?.shipping_class || "unknown";
              const code =
                li.price?.product?.metadata?.simtao_productCode || "GENERIC";
              const w = Number(li.price?.product?.metadata?.weight_g || 0);
              const qty = li.quantity || 0;

              if (!groups[cls]) {
                groups[cls] = {
                  productCode: code,
                  totalQty: 0,
                  totalWeight: 0,
                  avgWeight: 0,
                };
              }
              groups[cls].totalQty += qty;
              groups[cls].totalWeight += w * qty;
            }
          }

          for (const cls in groups) {
            groups[cls].avgWeight = Math.round(
              (groups[cls].totalWeight || 0) /
                Math.max(groups[cls].totalQty || 1, 1)
            );
          }

          console.log("📦 Grouped for SIMTAO:", groups);
        } catch (e) {
          console.error("[SIMTAO] grouping error:", e.message);
        }

      }

      return res.json({ received: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
