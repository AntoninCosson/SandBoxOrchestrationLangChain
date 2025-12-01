// modules/booking/models/Slot.js (CommonJS)
const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: { type: String, required: true },      // YYYY-MM-DD
  times: [{ type: String, required: true }],   // ['09:00','10:00',...]
}, { collection: 'slots' });

module.exports = mongoose.model('Slot', slotSchema);
