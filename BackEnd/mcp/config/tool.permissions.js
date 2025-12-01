module.exports = {
    getAvailableSlots: ["user", "assistant", "admin"],
    reserveSlot: ["user", "assistant", "admin"],
    sendConfirmationEmail: ["user","assistant", "admin"],
    sendAdminConfEmail: ["assistant","admin"],
    createBookingPayment: ["user", "assistant", "admin"],
    validateUser: ["assistant", "admin"]
  };