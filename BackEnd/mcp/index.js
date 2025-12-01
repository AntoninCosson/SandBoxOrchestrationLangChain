import mcpRouter from '../routes/mcp.routes.js';

export function mountMCP(app) {
  app.use('/mcp', mcpRouter);
}