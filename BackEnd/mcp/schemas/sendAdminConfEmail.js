// BackEnd/mcp/schemas/sendConfirmationEmail.schema.js
const schemaSendEmail = {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      appointmentDetails: {
        type: 'object',
        properties: {
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          service: { type: 'string' },
        },
        required: ['date', 'time'],
        additionalProperties: true,
      },
    },
    required: ['email', 'appointmentDetails'],
    additionalProperties: false,
  };
  module.exports = {
    type: 'object',
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      appointmentDetails: {
        type: 'object',
        additionalProperties: false,
        properties: {
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          service: { type: 'string' },
        },
        required: ['date', 'time'],
      },
    },
    required: ['email', 'appointmentDetails'],
  };