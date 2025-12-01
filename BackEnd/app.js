require("dotenv").config();

// Security check: JWT_SECRET must be configured
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not defined in .env');
  console.error('❌ The server will NOT start without JWT_SECRET for security reasons.');
  process.exit(1);
}

const { verifyMailer } = require('./utils/mailer');
// verifyMailer();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

require("./models/connection");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const top3Router = require("./routes/top3");
const shopRouter = require("./routes/shop");
const paymentsRouter = require('./routes/payments');
const stripeWebhook = require('./routes/stripeWebhook');
const shippingRouter = require('./routes/shipping');

const mcpRouter = require('./routes/mcp.routes');
const paymentConfirmedRouter = require("./routes/payment-confirmed");
const cartRouter = require("./routes/cart-reservation");

const analyticsRouter = require('./routes/analytics');

const app = express();

app.use(helmet());
app.use(compression());

const allowedOrigins = [
    "http://localhost:3001",
    "http://localhost:3000",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean);  

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
  
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  };
  
  app.use(cors(corsOptions));

app.use(logger("dev"));

app.use('/payments', stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

app.use("/users", usersRouter);
app.use("/top3", top3Router);
app.use("/shop", shopRouter);
app.use('/payments', paymentsRouter);
app.use('/shipping', shippingRouter);
app.use('/cart', cartRouter)

app.use("/", paymentConfirmedRouter);
app.use('/mcp', mcpRouter);
app.use('/analytics', analyticsRouter); 

// Errors

// 404 Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// Global error
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;

