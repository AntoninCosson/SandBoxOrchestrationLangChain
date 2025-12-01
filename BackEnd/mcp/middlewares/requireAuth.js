// BackEnd/mcp/middlewares/requireAuth.js
// Authentication middleware for MCP protocol routes
// Response format: { success: boolean, message?: string }
// Sets req.user: { id, role, scopes }
// Note: This is separate from /middlewares/auth.js by design (different protocols)
const jwt = require('jsonwebtoken')

module.exports = function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [type, token] = header.split(' ')
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' })
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = {
      id: payload.id,
      role: payload.role || 'user',
      scopes: payload.scopes || []
    }
    next()
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}