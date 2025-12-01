// BackEnd/mcp/schemas/reserveSlot.schema.js
const schemaReserveSlot = {
  type: 'object',
  properties: {
    date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
    // userId: { type: 'string', minLength: 1 },
    service: { type: 'string', minLength: 1 },
  },
  required: ['date', 'time', 'userId'],
  additionalProperties: false,
};
module.exports = {
  type: 'object',
  additionalProperties: false,
  properties: {
    date:  { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    time:  { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
    // userId:{ type: 'string', pattern: '^[a-fA-F0-9]{24}$' },
    service: { type: 'string' },
  },
  required: ['date', 'time'],
};