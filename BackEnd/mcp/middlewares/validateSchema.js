// BackEnd/mcp/middlewares/validateSchema.js (CommonJS)
const Ajv = require('ajv');

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

const schemaRegistry = require('../schemas');

module.exports = function validateSchema(req, res, next) {
  try {
    const { tool, params } = req.body || {};

    const schema = schemaRegistry[tool];
    if (!schema) {
      return res.status(404).json({ success:false, message:`Unknown tool schema: ${tool}` });
    }

    const validate = ajv.compile(schema);
    const ok = validate(params);

    if (!ok) {
      return res.status(400).json({
        success:false,
        message:'Schema validation failed',
        errors: validate.errors,
      });
    }

    next();
  } catch (e) {
    console.error('[validateSchema] error:', e);
    res.status(500).json({ success:false, message:'Validation middleware error' });
  }
};