const permissions = require("../config/tool.permissions");

module.exports = function requireToolPermission(req, res, next) {
  const tool = req.body.tool;
  const role = req.user.role;
  if (!permissions[tool]) {
    return res.status(403).json({
      success: false,
      message: "Unknown tool or no permission map",
    });
  }

  if (!permissions[tool].includes(role)) {
    return res.status(403).json({
      success: false,
      message: `Role "${role}" not allowed to call tool "${tool}"`,
    });
  }

  next();
};