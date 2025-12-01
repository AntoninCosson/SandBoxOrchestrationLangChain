// BackEnd/modules/shop/schemas/shopSchemas.js
const { z } = require('zod');
const mongoose = require('mongoose');

// Reusable validators
const mongoIdSchema = z.string().refine((val) => mongoose.isValidObjectId(val), {
  message: "Invalid MongoDB ObjectId",
});

const positiveIntSchema = z.number().int().positive();

// POST /shop/cart/add
const addToCartSchema = z.object({
  productId: mongoIdSchema,
  quantity: positiveIntSchema.default(1),
});

// PATCH /shop/cart/:productId
const updateCartQuantitySchema = z.object({
  quantity: z.number().int().min(0),
});

// POST /shop/cart/preview
const cartPreviewSchema = z.object({
  items: z.array(
    z.object({
      productId: mongoIdSchema,
      quantity: positiveIntSchema,
    })
  ).optional().default([]),
});

// POST /shop/cart/apply
const cartApplySchema = z.object({
  items: z.array(
    z.object({
      productId: mongoIdSchema,
      quantity: positiveIntSchema,
    })
  ).optional().default([]),
});

module.exports = {
  addToCartSchema,
  updateCartQuantitySchema,
  cartPreviewSchema,
  cartApplySchema,
  mongoIdSchema,
  positiveIntSchema,
};
