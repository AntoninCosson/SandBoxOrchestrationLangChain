// BackEnd/mcp/schemas/sendConfirmationEmail.schema.js
module.exports.schemaSendConfirmationEmail = {
  type: "object",
  additionalProperties: false,
  required: ["reservationId"],
  properties: {
    reservationId: { type: "string", minLength: 1 },
  },
};