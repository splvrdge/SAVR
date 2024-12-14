const bcrypt = require('bcrypt');
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const logger = require('../utils/logger');
const { secretKey, tokenExpiration, refreshTokenSecret, refreshTokenExpiration } = require("../config/auth");

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

// Update user profile
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const currentUserMail = req.user.email;

  if (!name || !email) {
    logger.warn('Missing required fields for profile update:', {
      userId: req.user.id,
      providedFields: { name: !!name, email: !!email }
    });
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields" 
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // First check if email already exists (if changing email)
    if (email !== currentUserMail) {
      const [existingUsers] = await connection.execute(
        'SELECT user_id FROM users WHERE user_email = ? AND user_email != ?',
        [email, currentUserMail]
      );
      
      if (existingUsers.length > 0) {
        await connection.rollback();
        logger.warn('Email already in use:', { 
          userId: req.user.id,
          attemptedEmail: email 
        });
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
    }

    // Update user profile
    const [results] = await connection.execute(
      `UPDATE users SET user_name = ?, user_email = ? WHERE user_email = ?`,
      [name, email, currentUserMail]
    );

    if (results.affectedRows === 0) {
      await connection.rollback();
      logger.warn('User not found:', { 
        userId: req.user.id,
        email: currentUserMail 
      });
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // If email was changed, revoke all tokens and generate new ones
    if (email !== currentUserMail) {
      // Get user information for new tokens
      const [userInfo] = await connection.execute(
        'SELECT user_id, user_name, user_email FROM users WHERE user_email = ?',
        [email]
      );
      
      if (userInfo.length === 0) {
        await connection.rollback();
        logger.warn('User not found after update:', { 
          userId: req.user.id,
          email 
        });
        return res.status(404).json({ 
          success: false, 
          message: "User not found after update" 
        });
      }

      const user = userInfo[0];

      // Revoke old tokens
      await connection.execute(
        `UPDATE tokens SET is_revoked = TRUE WHERE user_id = ?`,
        [user.user_id]
      );

      // Generate new tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Store new refresh token
      await connection.execute(
        `INSERT INTO tokens (user_id, refresh_token, expires_at) VALUES (?, ?, ?)`,
        [user.user_id, refreshToken, expiresAt]
      );

      await connection.commit();
      
      logger.info('Profile updated successfully with new tokens:', { 
        userId: user.user_id,
        fieldsUpdated: {
          name: true,
          email: true
        }
      });
      return res.json({ 
        success: true, 
        message: "Profile updated successfully",
        requireRelogin: true,
        accessToken,
        refreshToken,
        user_name: user.user_name,
        user_id: user.user_id
      });
    }

    await connection.commit();
    
    logger.info('Profile updated successfully:', { 
      userId: req.user.id,
      fieldsUpdated: {
        name: true,
        email: false
      }
    });
    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      requireRelogin: false
    });

  } catch (err) {
    await connection.rollback();
    logger.error('Failed to update profile:', { 
      userId: req.user.id,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  } finally {
    connection.release();
  }
};

// Get secured user information
exports.getSecuredInfo = async (req, res) => {
  try {
    const [userInfo] = await db.execute(
      'SELECT user_id, user_name, user_email, created_at FROM users WHERE user_id = ?',
      [req.user.id]
    );

    if (userInfo.length === 0) {
      logger.warn('User not found:', { userId: req.user.id });
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    logger.debug('Retrieved secured user info:', { userId: req.user.id });
    res.json({
      success: true,
      data: userInfo[0]
    });
  } catch (err) {
    logger.error('Failed to get secured info:', { 
      userId: req.user.id,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
