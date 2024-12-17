const bcrypt = require('bcrypt');
const { pool } = require("../config/db");
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
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.user_id;

    // First check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );

    if (!users[0]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    let updates = {};
    let params = [];
    let setStatements = [];

    // Handle name update
    if (name !== undefined && name !== user.user_name) {
      setStatements.push('user_name = ?');
      params.push(name);
      updates.name = name;
    }

    // Handle email update
    if (email !== undefined && email !== user.user_email) {
      // Check if email is already taken
      const [existingUsers] = await pool.query(
        'SELECT user_id FROM users WHERE user_email = ? AND user_id != ?',
        [email, userId]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }

      setStatements.push('user_email = ?');
      params.push(email);
      updates.email = email;
    }

    // Handle password update
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set new password'
        });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.user_password);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      setStatements.push('user_password = ?');
      params.push(hashedPassword);
      updates.password = '********';
    }

    if (setStatements.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes detected in the profile data'
      });
    }

    params.push(userId);
    const updateQuery = `
      UPDATE users 
      SET ${setStatements.join(', ')} 
      WHERE user_id = ?
    `;

    try {
      await pool.query(updateQuery, params);
      
      // Get updated user data
      const [updatedUser] = await pool.query(
        'SELECT user_id, user_name, user_email FROM users WHERE user_id = ?',
        [userId]
      );

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          name: updatedUser[0].user_name,
          email: updatedUser[0].user_email,
          ...updates.password && { password: updates.password }
        }
      });
    } catch (error) {
      logger.error('Error executing update query:', { 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        userId: req.user?.user_id 
      });
      throw error;
    }
  } catch (error) {
    logger.error('Error updating profile:', { 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.user_id 
    });
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
};

// Get secured user information
exports.getSecuredInfo = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [users] = await pool.query(
      'SELECT user_id, user_name, user_email, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (!users[0]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    logger.error('Error getting user info:', { 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.user_id 
    });
    res.status(500).json({
      success: false,
      message: 'Error getting user information'
    });
  }
};
