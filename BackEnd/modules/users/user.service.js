// BackEnd/modules/users/user.service.js (CommonJS)
const User = require('./models/User');

async function getUserWithReservations(userId) {
  return User.findById(userId)
    .populate({ path: 'reservationsVirtual' })
    .lean();
}

module.exports = { getUserWithReservations };
