const db = require("../config/db");

exports.addGoal = async (req, res) => {
  const { user_id, target_amount, description, category } = req.body;
  const query = `INSERT INTO goals (user_id, target_amount, description, category) VALUES (?, ?, ?, ?)`;

  try {
    const [results] = await db.execute(query, [
      user_id,
      target_amount,
      description,
      category,
    ]);
    res.status(201).json({ success: true, message: "Goal added successfully" });
  } catch (err) {
    console.error("Error adding goal:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getGoals = async (req, res) => {
  const { user_id } = req.params;
  const query = `SELECT * FROM goals WHERE user_id = ?`;

  try {
    const [results] = await db.execute(query, [user_id]);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateGoal = async (req, res) => {
  const { goal_id, target_amount, description, category } = req.body;
  const query = `UPDATE goals SET target_amount = ?, description = ?, category = ? WHERE goal_id = ?`;

  try {
    await db.execute(query, [target_amount, description, category, goal_id]);
    res.json({ success: true, message: "Goal updated successfully" });
  } catch (err) {
    console.error("Error updating goal:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
