const fs = require("fs");
const mysql = require("mysql2/promise");
const logger = require("../utils/logger");
require("dotenv").config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Add SSL configuration if certificates exist
if (process.env.NODE_ENV === 'production') {
  try {
    const sslCert = fs.readFileSync("./certs/ca.pem");
    config.ssl = { ca: sslCert };
    logger.info('SSL certificate loaded successfully');
  } catch (error) {
    logger.warn('SSL certificate not found, continuing without SSL');
  }
}

const pool = mysql.createPool(config);

// Test the database connection
pool.getConnection()
  .then(connection => {
    logger.info('Database connection established successfully');
    connection.release();
  })
  .catch(error => {
    logger.error('Failed to connect to database:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  });

module.exports = pool;
