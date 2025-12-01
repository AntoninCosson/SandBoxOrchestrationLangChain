// BackEnd/mcp/schemas/getAvailableSlots.schema.js
const schemaGetAvailableSlots = {
  type: 'object',
  properties: { date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
  required: ['date'],
  additionalProperties: false,
};
module.exports = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  },
  required: ['date'],
};