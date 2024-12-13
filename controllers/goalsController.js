const db = require("../config/db");

exports.addGoal = async (req, res) => {
  const { user_id, title, target_amount, target_date } = req.body;
  const query = `
    INSERT INTO goals (
      user_id, title, target_amount, target_date, current_amount
    ) VALUES (?, ?, ?, ?, 0)
  `;

  try {
    const [results] = await db.execute(query, [
      user_id,
      title,
      target_amount,
      target_date,
    ]);
    res.status(201).json({ 
      success: true, 
      message: "Goal added successfully",
      goal_id: results.insertId
    });
  } catch (err) {
    console.error("Error adding goal:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add goal",
      error: err.message
    });
  }
};

exports.getGoals = async (req, res) => {
  const { user_id } = req.params;
  
  if (!user_id) {
    return res.status(400).json({ 
      success: false, 
      message: "User ID is required" 
    });
  }

  try {
    const [userExists] = await db.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [user_id]
    );

    if (userExists.length === 0) {
      return res.json({ 
        success: true, 
        data: [] 
      });
    }

    const query = `
      SELECT 
        goal_id,
        user_id,
        title,
        target_amount,
        COALESCE(current_amount, 0) as current_amount,
        target_date,
        created_at,
        updated_at,
        DATEDIFF(target_date, CURDATE()) as days_remaining,
        COALESCE(ROUND((current_amount / target_amount * 100), 2), 0) as progress_percentage
      FROM goals
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    console.log('Goals Query:', query);
    console.log('User ID:', user_id);

    const [results] = await db.execute(query, [user_id]);
    
    const formattedGoals = results.map(goal => ({
      ...goal,
      target_amount: parseFloat(goal.target_amount),
      current_amount: parseFloat(goal.current_amount),
      progress_percentage: parseFloat(goal.progress_percentage)
    }));

    res.json({ 
      success: true, 
      data: formattedGoals
    });
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch goals",
      error: err.message
    });
  }
};

exports.updateGoal = async (req, res) => {
  const { goal_id } = req.params;
  const { title, target_amount, target_date } = req.body;
  const query = `
    UPDATE goals 
    SET title = ?, 
        target_amount = ?, 
        target_date = ?
    WHERE goal_id = ?
  `;

  try {
    await db.execute(query, [
      title,
      target_amount,
      target_date,
      goal_id
    ]);
    res.json({ success: true, message: "Goal updated successfully" });
  } catch (err) {
    console.error("Error updating goal:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update goal",
      error: err.message
    });
  }
};

exports.deleteGoal = async (req, res) => {
  const { goal_id } = req.params;
  const query = `DELETE FROM goals WHERE goal_id = ?`;

  try {
    await db.execute(query, [goal_id]);
    res.json({ success: true, message: "Goal deleted successfully" });
  } catch (err) {
    console.error("Error deleting goal:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete goal",
      error: err.message
    });
  }
};

// New contribution-related endpoints
exports.addContribution = async (req, res) => {
  const { goal_id, user_id, amount, notes } = req.body;
  
  // Validate input
  if (!goal_id || !user_id || !amount) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: goal_id, user_id, and amount are required" 
    });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: "Amount must be a positive number" 
    });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check if goal exists and belongs to user
    const [goals] = await connection.execute(
      'SELECT * FROM goals WHERE goal_id = ? AND user_id = ?',
      [goal_id, user_id]
    );

    if (goals.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Goal not found or does not belong to user" 
      });
    }

    // Add contribution
    const [contribution] = await connection.execute(
      `INSERT INTO goal_contributions (goal_id, user_id, amount, notes) 
       VALUES (?, ?, ?, ?)`,
      [goal_id, user_id, amount, notes || null]
    );

    await connection.commit();
    
    res.status(201).json({ 
      success: true, 
      message: "Contribution added successfully",
      contribution_id: contribution.insertId
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error adding contribution:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add contribution",
      error: err.message
    });
  } finally {
    connection.release();
  }
};

exports.getContributions = async (req, res) => {
  const { goal_id } = req.params;
  const query = `
    SELECT 
      gc.*,
      DATE_FORMAT(gc.contribution_date, '%Y-%m-%d') as formatted_date
    FROM goal_contributions gc
    WHERE gc.goal_id = ?
    ORDER BY gc.contribution_date DESC
  `;

  try {
    const [results] = await db.execute(query, [goal_id]);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching contributions:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch contributions",
      error: err.message
    });
  }
};

exports.deleteContribution = async (req, res) => {
  const { contribution_id } = req.params;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete contribution
    await connection.execute(
      'DELETE FROM goal_contributions WHERE contribution_id = ?',
      [contribution_id]
    );

    // The triggers will automatically update the goal's progress

    await connection.commit();
    res.json({ success: true, message: "Contribution deleted successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting contribution:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete contribution",
      error: err.message
    });
  } finally {
    connection.release();
  }
};
