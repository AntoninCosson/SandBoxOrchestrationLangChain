// BackEnd/middlewares/authRateLimit.js
// Rate limiting for authentication routes (signin/signup)
const rateLimit = require('express-rate-limit');

// Signin: 5 attempts per 15 minutes per IP
const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    success: false,
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Signup: 3 accounts per hour per IP
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: {
    success: false,
    error: 'Too many accounts created. Please try again later.',
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

module.exports = {
  signinLimiter,
  signupLimiter,
};
