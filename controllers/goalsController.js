const db = require('../config/db');
const logger = require('../utils/logger');

exports.createGoal = async (req, res) => {
  try {
    const { title, target_amount, target_date, description } = req.body;
    const userId = req.user.user_id;

    const [result] = await db.execute(
      'INSERT INTO goals (user_id, title, target_amount, target_date, description) VALUES (?, ?, ?, ?, ?)',
      [userId, title, target_amount, target_date, description]
    );

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: {
        goal_id: result.insertId
      }
    });
  } catch (error) {
    logger.error('Failed to create goal:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Error creating goal'
    });
  }
};

exports.getGoals = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [goals] = await db.execute(`
      SELECT 
        g.*,
        COALESCE(SUM(gc.amount), 0) as current_amount,
        COALESCE(COUNT(gc.contribution_id), 0) as contribution_count
      FROM goals g
      LEFT JOIN goal_contributions gc ON g.goal_id = gc.goal_id
      WHERE g.user_id = ?
      GROUP BY g.goal_id
      ORDER BY g.created_at DESC
    `, [userId]);

    if (goals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No goals found'
      });
    }

    res.json({
      success: true,
      data: goals.map(goal => ({
        ...goal,
        target_amount: parseFloat(goal.target_amount),
        current_amount: parseFloat(goal.current_amount),
        progress: (goal.current_amount / goal.target_amount) * 100
      }))
    });
  } catch (error) {
    logger.error('Failed to get goals:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Error retrieving goals'
    });
  }
};

exports.addContribution = async (req, res) => {
  try {
    const { goal_id, amount, notes } = req.body;
    const userId = req.user.user_id;

    // Verify goal belongs to user
    const [goal] = await db.execute(
      'SELECT * FROM goals WHERE goal_id = ? AND user_id = ?',
      [goal_id, userId]
    );

    if (goal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized'
      });
    }

    const [result] = await db.execute(
      'INSERT INTO goal_contributions (goal_id, user_id, amount, notes) VALUES (?, ?, ?, ?)',
      [goal_id, userId, amount, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Contribution added successfully',
      data: {
        contribution_id: result.insertId
      }
    });
  } catch (error) {
    logger.error('Failed to add contribution:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Error adding contribution'
    });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { goal_id } = req.params;
    const { title, target_amount, target_date, description } = req.body;
    const userId = req.user.user_id;

    const [goal] = await db.execute(
      'SELECT * FROM goals WHERE goal_id = ? AND user_id = ?',
      [goal_id, userId]
    );

    if (goal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized'
      });
    }

    await db.execute(
      'UPDATE goals SET title = ?, target_amount = ?, target_date = ?, description = ? WHERE goal_id = ?',
      [title, target_amount, target_date, description, goal_id]
    );

    res.json({
      success: true,
      message: 'Goal updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update goal:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Error updating goal'
    });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { goal_id } = req.params;
    const userId = req.user.user_id;

    const [goal] = await db.execute(
      'SELECT * FROM goals WHERE goal_id = ? AND user_id = ?',
      [goal_id, userId]
    );

    if (goal.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized'
      });
    }

    await db.execute('DELETE FROM goals WHERE goal_id = ?', [goal_id]);

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete goal:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Error deleting goal'
    });
  }
};
