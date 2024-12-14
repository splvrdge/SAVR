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

// Initialize routes with proper error handling
const initializeRoutes = () => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/income", incomeRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/goals", goalsRoutes);
  app.use("/api/financial", financialRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/categories", categoryRoutes);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Handle 404
  app.use((req, res) => {
    res.status(404).json({ 
      success: false, 
      message: "Route not found" 
    });
  });
};

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// Initialize database connection
const initializeDatabase = async () => {
  try {
    await db.getConnection();
    logger.info("Database connection established");
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
};

// Schedule token cleanup
cron.schedule("0 0 * * *", async () => {
  try {
    const query = `DELETE FROM tokens WHERE expires_at <= NOW()`;
    await db.execute(query);
    logger.info("Expired tokens cleaned up");
  } catch (error) {
    logger.error("Token cleanup failed:", error);
  }
});

// Start server
const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    
    // Initialize routes after server starts
    initializeRoutes();
    
    // Initialize database connection
    initializeDatabase().catch(error => {
      logger.error("Failed to initialize database:", error);
      process.exit(1);
    });
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

startServer();
