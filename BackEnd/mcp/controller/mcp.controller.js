// BackEnd/mcp/controller/mcp.controller.js (CommonJS)
const services = require("../service/mcp.service");

exports.getConfig = (req, res) => {
  res.json({ success: true, tools: Object.keys(services) });
};

exports.callTool = async (req, res) => {
  try {
    const { tool, params } = req.body || {};
    const fn = services[tool];
    if (typeof fn !== "function") {
      return res
        .status(400)
        .json({ success: false, message: `Unknown tool: ${tool}` });
    }

    const safeParams = {
      ...(params || {}),
      userId: req.user?.id || (params && params.userId),
    };

    const result = await fn(safeParams);

    return res.json({ success: true, tool, result });
  } catch (e) {
    console.error("[mcp.controller] callTool error:", e);
    res
      .status(500)
      .json({
        success: false,
        message: "Tool execution error",
        error: e.message,
      });
  }
};
