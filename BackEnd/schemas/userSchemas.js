// BackEnd/schemas/userSchemas.js
// Validation schemas for user routes using Zod
const { z } = require('zod');

// ============================================
// Reusable field schemas
// ============================================

const emailSchema = z
  .string({ required_error: "Email is required" })
  .email("Invalid email format")
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long");

const usernameSchema = z
  .string({ required_error: "Username is required" })
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, _ and -")
  .trim();


/**
 * POST /users/signup
 */
const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/**
 * POST /users/login
 */
const loginSchema = z.object({
  email: emailSchema.optional(),
  username: usernameSchema.optional(),
  identifier: z.string().trim().optional(),
  password: passwordSchema,
}).refine(
  (data) => data.email || data.username || data.identifier,
  {
    message: "Either email, username, or identifier is required",
    path: ["identifier"],
  }
);

/**
 * POST /users/refresh
 */
const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: "Refresh token is required" }),
});

/**
 * PATCH /users/bestScoreUser
 */
const updateBestScoreSchema = z.object({
  username: usernameSchema,
  score: z.number().int().min(0, "Score must be positive"),
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  updateBestScoreSchema,
  
  emailSchema,
  passwordSchema,
  usernameSchema,
};
