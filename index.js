require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const goalsRoutes = require("./routes/goalsRoutes");
const financialRoutes = require("./routes/financialRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cron = require("node-cron");
const db = require("./config/db");
const logger = require("./utils/logger");
const fs = require('fs');
const path = require('path');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(bodyParser.json());

const allowedOrigins = [
  'https://savr-fintracker.vercel.app',
  'https://savr-backend.onrender.com',
  'http://localhost:8081',
  'http://localhost:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Define routes with their descriptions
const routes = [
  { path: "/api/auth", router: authRoutes, description: "Authentication endpoints" },
  { path: "/api/users", router: userRoutes, description: "User management" },
  { path: "/api/income", router: incomeRoutes, description: "Income tracking" },
  { path: "/api/expenses", router: expenseRoutes, description: "Expense tracking" },
  { path: "/api/goals", router: goalsRoutes, description: "Financial goals" },
  { path: "/api/financial", router: financialRoutes, description: "Financial overview" },
  { path: "/api/analytics", router: analyticsRoutes, description: "Financial analytics" },
  { path: "/api/categories", router: categoryRoutes, description: "Transaction categories" }
];

// Mount all API routes
routes.forEach(({ path, router }) => {
  app.use(path, router);
});

// API documentation endpoint
app.get("/api", (req, res) => {
  const apiDocs = routes.map(({ path, description }) => ({
    path,
    description
  }));

  res.json({
    name: "Savr-FinTracker API",
    version: "1.0.0",
    description: "Financial tracking and management API",
    routes: apiDocs
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Handle 404 errors
app.use((req, res) => {
  logger.warn('Route not found:', { 
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : "Internal server error"
  });
});

// Initialize database connection
async function initializeDatabase() {
  try {
    const connection = await db.getConnection();
    logger.info('Database connected successfully');
    connection.release();
  } catch (error) {
    logger.error('Database connection failed:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', {
    error: reason.message,
    stack: process.env.NODE_ENV === 'development' ? reason.stack : undefined
  });
  process.exit(1);
});

// Schedule token cleanup
cron.schedule("0 0 * * *", async () => {
  try {
    const connection = await db.getConnection();
    await connection.execute('DELETE FROM tokens WHERE expires_at <= NOW()');
    logger.info('Expired tokens cleaned up successfully');
    connection.release();
  } catch (error) {
    logger.error('Failed to clean up expired tokens:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start the server
startServer();
