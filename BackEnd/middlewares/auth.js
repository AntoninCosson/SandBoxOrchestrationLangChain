// BackEnd/middlewares/auth.js
// Authentication middleware for classic REST routes
// Response format: { success: boolean, error?: string }
// Sets req.user: { id, role, username }
const jwt = require('jsonwebtoken');

module.exports = async function (req, res, next) {
  try {
    const h = req.headers.authorization || "";


    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token)
      return res.status(401).json({ success: false, error: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role || 'user', username: decoded.username };
    return next();
  } catch (e) {

    // console.error('JWT verify error:', e.name, e.message);

    return res
      .status(401)
      .json({ success: false, error: "Invalid or expired token" });
  }
};
