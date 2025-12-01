// BackEnd/mcp/middlewares/validateBody.js (CommonJS)

module.exports = function validateBody(requiredKey = 'tool') {
  return (req, res, next) => {
    try {
      const body = req.body || {};
      if (typeof body !== 'object') {
        return res.status(400).json({ success:false, message:'Body must be JSON object' });
      }

      // tool
      if (!body[requiredKey] || typeof body[requiredKey] !== 'string') {
        return res.status(400).json({ success:false, message:`Missing "${requiredKey}" (string).` });
      }

      // params
      if (body.params == null || typeof body.params !== 'object' || Array.isArray(body.params)) {
        return res.status(400).json({ success:false, message:'Missing "params" (object).' });
      }

      next();
    } catch (e) {
      console.error('[validateBody] error:', e);
      res.status(500).json({ success:false, message:'Validation middleware error' });
    }
  };
};