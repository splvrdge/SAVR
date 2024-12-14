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

const PORT = process.env.SERVER_PORT || 3000;

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

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Initialize routes with logging
const initializeRoutes = () => {
  const routes = [
    { path: "/api/auth", router: authRoutes, name: "Authentication" },
    { path: "/api/user", router: userRoutes, name: "User" },
    { path: "/api/income", router: incomeRoutes, name: "Income" },
    { path: "/api/expense", router: expenseRoutes, name: "Expense" },
    { path: "/api/goals", router: goalsRoutes, name: "Goals" },
    { path: "/api/financial", router: financialRoutes, name: "Financial" },
    { path: "/api/analytics", router: analyticsRoutes, name: "Analytics" },
    { path: "/api/categories", router: categoryRoutes, name: "Categories" }
  ];

  routes.forEach(({ path, router, name }) => {
    app.use(path, router);
    logger.info(`✓ ${name} routes initialized at ${path}`);
  });
};

// Initialize all routes
initializeRoutes();

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database connection
const initializeDatabase = async () => {
  try {
    const connection = await db.getConnection();
    connection.release();
    logger.info('✓ Database connection established');
  } catch (err) {
    logger.error('Failed to connect to database:', err);
    process.exit(1);
  }
};

// Schedule token cleanup
cron.schedule("0 0 * * *", async () => {
  try {
    const query = `DELETE FROM tokens WHERE expires_at <= NOW()`;
    await db.execute(query);
    logger.info("✓ Expired tokens cleaned up");
  } catch (err) {
    logger.error("Failed to clean up tokens:", err);
  }
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      logger.info('╔═══════════════════════════════════════╗');
      logger.info('║        Savr-FinTracker Backend        ║');
      logger.info('╚═══════════════════════════════════════╝');
      logger.info(`✓ Server is running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('═══════════════════════════════════════════');
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
