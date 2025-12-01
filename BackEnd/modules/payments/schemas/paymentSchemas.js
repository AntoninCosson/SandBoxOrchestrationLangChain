// BackEnd/modules/payments/schemas/paymentSchemas.js
const { z } = require('zod');

// POST /payments/checkout
const checkoutSchema = z.object({
  customer_email: z.string().email("Invalid email").optional(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  shipping: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().length(2).toUpperCase().default("FR"),
  }).optional(),
});

module.exports = {
  checkoutSchema,
};
