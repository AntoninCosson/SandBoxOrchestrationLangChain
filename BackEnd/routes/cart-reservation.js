// routes/cart-reservation.js
const express = require("express");
const router = express.Router();
// const cartService = require("../service/cart.service");

router.post("/add-reservation", async (req, res) => {
  try {
    const { reservationId, date, time } = req.body;

    if (!reservationId || !date || !time) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const pseudoProduct = {
      productId: `reservation-${reservationId}`,
      name: `Réservation ${date} ${time}`,
      price: 50,
      quantity: 1,
      isVirtual: true,
    };

    const userId = req.user?._id || null;

    const cart = await cartService.addItem(userId, pseudoProduct);

    return res.json({ success: true, cart });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
