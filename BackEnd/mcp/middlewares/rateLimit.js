// CommonJS, safe defaults, IPv6-friendly (no custom keyGenerator)
const rateLimit = require('express-rate-limit');

// 30 req/min per IP
const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

module.exports = mcpLimiter;