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
    const userId = req.user.id;

    const [user] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user[0]) {
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

    if (email && email !== user[0].user_email) {
      // Check if email is already taken
      const [existingUser] = await db.execute(
        'SELECT user_id FROM users WHERE user_email = ? AND user_id != ?',
        [email, userId]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }

      setStatements.push('user_email = ?');
      params.push(email);
      updates.email = email;
    }

    if (newPassword && currentPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user[0].password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      setStatements.push('password = ?');
      params.push(hashedPassword);
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
      data: {
        name: updates.name || user[0].user_name,
        email: updates.email || user[0].user_email
      }
    });
  } catch (error) {
    logger.error('Error updating profile:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    const userId = req.user.id;

    const [user] = await db.execute(
      'SELECT user_id, user_name, user_email, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (!user[0]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const [financialSummary] = await db.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COUNT(DISTINCT CASE WHEN type = 'income' THEN id END) as income_count,
        COUNT(DISTINCT CASE WHEN type = 'expense' THEN id END) as expense_count
      FROM user_financial_data
      WHERE user_id = ?
    `, [userId]);

    const [goals] = await db.execute(
      'SELECT COUNT(*) as goal_count FROM goals WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user[0].user_id,
          name: user[0].user_name,
          email: user[0].user_email,
          created_at: user[0].created_at
        },
        financial_summary: {
          total_income: parseFloat(financialSummary[0].total_income),
          total_expenses: parseFloat(financialSummary[0].total_expenses),
          net_worth: parseFloat(financialSummary[0].total_income - financialSummary[0].total_expenses),
          income_count: financialSummary[0].income_count,
          expense_count: financialSummary[0].expense_count
        },
        goals: {
          total_count: goals[0].goal_count
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching secured info:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Error retrieving user information'
    });
  }
};
