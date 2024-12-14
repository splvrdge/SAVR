const db = require('../config/db');
const logger = require('../utils/logger');

exports.createGoal = async (req, res) => {
  let connection;
  try {
    const { title, target_amount, target_date, description } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
      logger.error('User ID missing from token payload');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User ID missing'
      });
    }

    logger.info('Creating goal:', {
      userId,
      title,
      target_amount,
      target_date,
      description,
      body: req.body
    });

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.execute(
        'INSERT INTO goals (user_id, title, target_amount, target_date, description) VALUES (?, ?, ?, ?, ?)',
        [userId, title, target_amount, target_date, description]
      );

      await connection.commit();

      logger.info('Goal created:', {
        goalId: result.insertId
      });

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: {
          goal_id: result.insertId
        }
      });
    } catch (error) {
      logger.error('Database error during goal creation:', {
        error: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        parameters: [userId, title, target_amount, target_date, description]
      });
      throw error;
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Failed to create goal:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      body: req.body,
      userId: req.user?.user_id
    });
    res.status(500).json({
      success: false,
      message: 'Error creating goal'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getGoals = async (req, res) => {
  let connection;
  try {
    const userId = req.user.user_id;

    if (!userId) {
      logger.error('User ID missing from token payload');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User ID missing'
      });
    }

    connection = await db.getConnection();

    try {
      const [goals] = await connection.execute(`
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

      res.json({
        success: true,
        data: goals || []
      });
    } catch (error) {
      logger.error('Database error during goal retrieval:', {
        error: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        parameters: [userId]
      });
      throw error;
    }
  } catch (error) {
    logger.error('Failed to get goals:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.user_id
    });
    res.status(500).json({
      success: false,
      message: 'Error retrieving goals'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.addContribution = async (req, res) => {
  let connection;
  try {
    const { goal_id, amount, notes } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
      logger.error('User ID missing from token payload');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User ID missing'
      });
    }

    logger.info('Adding contribution:', {
      userId,
      goal_id,
      amount,
      notes,
      body: req.body
    });

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Verify goal ownership
      const [goals] = await connection.execute(
        'SELECT * FROM goals WHERE goal_id = ? AND user_id = ?',
        [goal_id, userId]
      );

      if (goals.length === 0) {
        logger.warn('Goal not found or unauthorized:', {
          userId,
          goal_id
        });
        return res.status(404).json({
          success: false,
          message: 'Goal not found or unauthorized'
        });
      }

      // Add contribution
      const [result] = await connection.execute(
        'INSERT INTO goal_contributions (goal_id, user_id, amount, notes) VALUES (?, ?, ?, ?)',
        [goal_id, userId, amount, notes || null]
      );

      await connection.commit();

      logger.info('Contribution added:', {
        contributionId: result.insertId
      });

      res.status(201).json({
        success: true,
        message: 'Contribution added successfully',
        data: {
          contribution_id: result.insertId
        }
      });
    } catch (error) {
      logger.error('Database error during contribution:', {
        error: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        parameters: [goal_id, userId, amount, notes]
      });
      throw error;
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Failed to add contribution:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      body: req.body,
      userId: req.user?.user_id
    });
    res.status(500).json({
      success: false,
      message: 'Error adding contribution'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.updateGoal = async (req, res) => {
  let connection;
  try {
    const { goal_id } = req.params;
    const { title, target_amount, target_date, description } = req.body;
    const userId = req.user.user_id;

    if (!userId) {
      logger.error('User ID missing from token payload');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User ID missing'
      });
    }

    logger.info('Updating goal:', {
      userId,
      goal_id,
      title,
      target_amount,
      target_date,
      description,
      body: req.body
    });

    connection = await db.getConnection();

    try {
      const [goal] = await connection.execute(
        'SELECT * FROM goals WHERE goal_id = ? AND user_id = ?',
        [goal_id, userId]
      );

      if (goal.length === 0) {
        logger.warn('Goal not found or unauthorized:', {
          userId,
          goal_id
        });
        return res.status(404).json({
          success: false,
          message: 'Goal not found or unauthorized'
        });
      }

      await connection.beginTransaction();

      await connection.execute(
        'UPDATE goals SET title = ?, target_amount = ?, target_date = ?, description = ? WHERE goal_id = ? AND user_id = ?',
        [title, target_amount, target_date, description, goal_id, userId]
      );

      await connection.commit();

      logger.info('Goal updated:', {
        goalId: goal_id
      });

      res.json({
        success: true,
        message: 'Goal updated successfully'
      });
    } catch (error) {
      logger.error('Database error during goal update:', {
        error: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        parameters: [title, target_amount, target_date, description, goal_id, userId]
      });
      throw error;
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Failed to update goal:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.user_id
    });
    res.status(500).json({
      success: false,
      message: 'Error updating goal'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.deleteGoal = async (req, res) => {
  let connection;
  try {
    const { goal_id } = req.params;
    const userId = req.user.user_id;

    if (!userId) {
      logger.error('User ID missing from token payload');
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: User ID missing'
      });
    }

    logger.info('Deleting goal:', {
      userId,
      goal_id
    });

    connection = await db.getConnection();

    try {
      const [goal] = await connection.execute(
        'SELECT * FROM goals WHERE goal_id = ? AND user_id = ?',
        [goal_id, userId]
      );

      if (goal.length === 0) {
        logger.warn('Goal not found or unauthorized:', {
          userId,
          goal_id
        });
        return res.status(404).json({
          success: false,
          message: 'Goal not found or unauthorized'
        });
      }

      await connection.beginTransaction();

      await connection.execute('DELETE FROM goals WHERE goal_id = ? AND user_id = ?', [goal_id, userId]);

      await connection.commit();

      logger.info('Goal deleted:', {
        goalId: goal_id
      });

      res.json({
        success: true,
        message: 'Goal deleted successfully'
      });
    } catch (error) {
      logger.error('Database error during goal deletion:', {
        error: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sql: error.sql,
        parameters: [goal_id, userId]
      });
      throw error;
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    logger.error('Failed to delete goal:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: req.user?.user_id
    });
    res.status(500).json({
      success: false,
      message: 'Error deleting goal'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
