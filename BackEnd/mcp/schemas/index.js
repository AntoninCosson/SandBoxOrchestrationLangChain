const sendAdminConfEmail = require('./sendAdminConfEmail.js');

module.exports = {
  getAvailableSlots: require('./getAvailableSlots.schema.js'),
  reserveSlot: require('./reserveSlot.schema.js'),
  sendConfirmationEmail: require('./sendConfirmationEmail.schema.js'),
  sendAdminConfEmail: require("./sendAdminConfEmail.js"),
  createBookingPayment: require('./createBookingPayment.schema.js'),
};