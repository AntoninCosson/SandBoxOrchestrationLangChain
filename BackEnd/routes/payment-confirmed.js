// BackEnd/routes/payment-confirmed.js
const express = require("express");
const router = express.Router();

router.post("/payment-confirmed", async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing reservationId" });
    }

    console.log("✅ [Payment Confirmed] Reservation:", reservationId);

    return res.json({ success: true });
  } catch (e) {
    console.error("[payment-confirmed] error:", e);
    return res.status(500).json({ success: false, error: "internal_error" });
  }
});

module.exports = router;
