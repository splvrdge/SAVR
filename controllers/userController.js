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
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const userId = req.user.user_id;

    const [users] = await db.execute(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );

    if (!users[0]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let updates = {};
    let params = [];
    let setStatements = [];

    if (name) {
      setStatements.push('user_name = ?');
      params.push(name);
      updates.name = name;
    }

    if (email) {
      setStatements.push('user_email = ?');
      params.push(email);
      updates.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set new password'
        });
      }

      const validPassword = await bcrypt.compare(currentPassword, users[0].user_password);
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
        message: 'No updates provided'
      });
    }

    params.push(userId);
    const updateQuery = `
      UPDATE users 
      SET ${setStatements.join(', ')} 
      WHERE user_id = ?
    `;

    await db.execute(updateQuery, params);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updates
    });
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

    const [users] = await db.execute(
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
