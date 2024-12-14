const fs = require("fs");
const mysql = require("mysql2/promise");
const logger = require("../utils/logger");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    ca: fs.readFileSync("./certs/ca.pem"),
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Remove the automatic connection check here since we'll handle it in index.js

module.exports = pool;
