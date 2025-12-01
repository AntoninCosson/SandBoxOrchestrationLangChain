// BackEnd/modules/shipping/schemas/shippingSchemas.js
const { z } = require('zod');

// POST /shipping/validate-address
const validateAddressSchema = z.object({
  q: z.string().trim().optional(),
  line1: z.string().trim().optional(),
  line2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  country: z.string().trim().default("FR"),
}).refine(
  (data) => data.q || (data.line1 && data.city && data.postcode),
  {
    message: "Either 'q' or 'line1 + city + postcode' is required",
    path: ["q"],
  }
);

module.exports = {
  validateAddressSchema,
};
