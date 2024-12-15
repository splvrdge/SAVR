const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const logger = require("../utils/logger");
const {
  secretKey,
  tokenExpiration,
  refreshTokenSecret,
  refreshTokenExpiration,
} = require("../config/auth");

function generateAccessToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      user_email: user.user_email,
      user_name: user.user_name,
    },
    secretKey,
    { expiresIn: tokenExpiration }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ user_id: user.user_id }, refreshTokenSecret, {
    expiresIn: refreshTokenExpiration,
  });
}

exports.login = async (req, res) => {
  const { user_email, user_password } = req.body;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Find user by email
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE user_email = ?',
      [user_email]
    );

    if (users.length === 0) {
      logger.warn(`Login failed: User not found for email ${user_email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Compare password
    const validPassword = await bcrypt.compare(user_password, user.user_password);
    if (!validPassword) {
      logger.warn(`Login failed: Invalid password for user ${user.user_id}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save refresh token to database
    await connection.execute(
      'INSERT INTO tokens (user_id, refresh_token, expires_at) VALUES (?, ?, ?)',
      [user.user_id, refreshToken, expiresAt]
    );

    await connection.commit();

    logger.info(`User logged in successfully: ${user.user_id}`);

    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_email: user.user_email
      }
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Login error:', { 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Error during login'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.signup = async (req, res) => {
  const { user_name, user_email, user_password } = req.body;

  try {
    // Check if user already exists
    const checkUserQuery = `SELECT * FROM users WHERE user_email = ?`;
    const [existingUsers] = await pool.execute(checkUserQuery, [user_email]);

    if (existingUsers.length > 0) {
      logger.warn('Registration attempt with existing email:', { email: user_email });
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(user_password, 10);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Create user
      const createUserQuery = `INSERT INTO users (user_name, user_email, user_password) VALUES (?, ?, ?)`;
      const [userResults] = await connection.execute(createUserQuery, [
        user_name,
        user_email,
        hashedPassword,
      ]);

      const user = {
        user_id: userResults.insertId,
        user_name,
        user_email,
      };

      // Initialize financial summary
      const initFinancialQuery = `
        INSERT INTO user_financial_summary (
          user_id,
          current_balance,
          total_income,
          total_expenses
        ) VALUES (?, 0, 0, 0)
      `;
      await connection.execute(initFinancialQuery, [user.user_id]);

      // Create tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const insertTokenQuery = `
        INSERT INTO tokens (user_id, refresh_token, expires_at)
        VALUES (?, ?, ?)
      `;
      await connection.execute(insertTokenQuery, [
        user.user_id,
        refreshToken,
        expiresAt
      ]);

      await connection.commit();

      logger.info('User registered successfully:', { userId: user.user_id, email: user.user_email });
      res.json({
        success: true,
        message: "Signup successful",
        accessToken,
        refreshToken,
        user_name,
        user_id: user.user_id
      });
    } catch (error) {
      await connection.rollback();
      logger.error('Registration failed:', { 
        email: user_email,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error('Error signing up:', { 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    console.error("Error signing up:", err);
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
};

exports.refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    logger.warn('Refresh token attempt without token');
    return res.status(401).json({ success: false, message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(refresh_token, refreshTokenSecret);
    const user_id = decoded.user_id;

    const [users] = await pool.execute(
      `SELECT * FROM users WHERE user_id = ?`,
      [user_id]
    );

    if (users.length === 0) {
      logger.warn('Refresh token attempt with non-existent user', { userId: user_id });
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const user = users[0];
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await connection.execute(
        `INSERT INTO tokens (user_id, refresh_token, expires_at) VALUES (?, ?, ?)`,
        [user_id, newRefreshToken, expiresAt]
      );

      await connection.commit();

      logger.info('Refresh token generated successfully:', { userId: user_id });
      res.status(200).json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken
      });
    } catch (error) {
      await connection.rollback();
      logger.error('Refresh token generation failed:', { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      throw error;
    } finally {
      connection.release();
    }
  } catch (err) {
    logger.error('Error in refresh token:', { 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.logout = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    logger.warn('Logout attempt without token');
    return res.status(400).json({ success: false, message: "Refresh token required" });
  }

  try {
    await pool.execute(
      `UPDATE tokens SET expires_at = NOW() WHERE refresh_token = ?`,
      [refresh_token]
    );

    logger.info('User logged out successfully');
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    logger.error('Error in logout:', { 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.checkEmail = async (req, res) => {
  const { user_email } = req.body;
  let connection;

  if (!user_email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    connection = await pool.getConnection();
    const query = `SELECT * FROM users WHERE user_email = ?`;
    const [results] = await connection.execute(query, [user_email]);

    if (results.length > 0) {
      logger.warn('Email check attempt with existing email:', { user_email });
      res.status(200).json({ available: false, message: "Email is already taken" });
    } else {
      res.status(200).json({ available: true, message: "Email is available" });
    }
  } catch (err) {
    logger.error('Error checking email:', { 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(500).json({ success: false, message: "Error checking email availability" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.refreshTokenController = async (req, res) => {
  let connection;
  try {
    const { refreshToken: oldRefreshToken } = req.body;
    
    if (!oldRefreshToken) {
      logger.warn('Refresh token attempt without token');
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    logger.info('Attempting to refresh token:', { oldRefreshToken });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Check if token exists and hasn't expired (with 5 minute buffer)
    const [tokenResults] = await connection.execute(
      "SELECT * FROM tokens WHERE refresh_token = ? AND expires_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)",
      [oldRefreshToken]
    );

    logger.info('Token lookup results:', { 
      found: tokenResults.length > 0,
      tokenResults: tokenResults[0] 
    });

    if (tokenResults.length === 0) {
      logger.warn('Refresh token not found or expired');
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, refreshTokenSecret);
      logger.info('Token decoded successfully:', { userId: decoded.user_id });
    } catch (err) {
      logger.error('Token verification failed:', { error: err.message });
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }
    
    const [users] = await connection.execute(
      "SELECT user_id, user_email, user_name FROM users WHERE user_id = ?",
      [decoded.user_id]
    );

    logger.info('User lookup results:', { 
      found: users.length > 0,
      userId: decoded.user_id 
    });

    if (users.length === 0) {
      logger.warn('Refresh token attempt with non-existent user', { userId: decoded.user_id });
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = users[0];

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Save new refresh token
    await connection.execute(
      'INSERT INTO tokens (user_id, refresh_token, expires_at) VALUES (?, ?, ?)',
      [user.user_id, refreshToken, expiresAt]
    );

    await connection.commit();

    logger.info('Token refreshed successfully:', { 
      userId: user.user_id,
      newTokenExpiry: expiresAt 
    });

    res.json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      refreshToken
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Error refreshing token:', { 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error refreshing token"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  login: exports.login,
  signup: exports.signup,
  checkEmail: exports.checkEmail,
  refreshToken: exports.refreshToken,
  refreshTokenController: exports.refreshTokenController,
  logout: exports.logout
};
