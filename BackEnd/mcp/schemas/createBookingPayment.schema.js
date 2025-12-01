// BackEnd/mcp/schemas/createBookingPayment.schema.js
module.exports = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reservationId: { 
      type: 'string', 
      pattern: '^[a-fA-F0-9]{24}$',
      description: 'MongoDB ObjectId of the reservation'
    },
  },
  required: ['reservationId'],
};
