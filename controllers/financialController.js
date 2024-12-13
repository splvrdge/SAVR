const db = require("../config/db");

exports.getFinancialSummary = async (req, res) => {
  const { user_id } = req.params;
  const query = `SELECT current_balance, net_savings, total_expenses FROM user_financial_summary WHERE user_id = ?`;

  try {
    const [results] = await db.execute(query, [user_id]);

    if (results.length === 0) {
      // Return default values for new users instead of 404
      return res.json({ 
        success: true, 
        data: {
          current_balance: 0,
          net_savings: 0,
          total_expenses: 0
        }
      });
    }

    res.json({ success: true, data: results[0] });
  } catch (err) {
    console.error("Error fetching financial summary:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getFinancialHistory = async (req, res) => {
  const { user_id } = req.params;
  const { type, sortBy } = req.query;

  let query = `SELECT * FROM user_financial_data WHERE user_id = ?`;

  if (type) {
    query += ` AND type = ?`;
  }

  if (sortBy) {
    query += ` ORDER BY timestamp ${sortBy === "asc" ? "ASC" : "DESC"}`;
  }

  try {
    const [results] = await db.execute(
      query,
      type ? [user_id, type] : [user_id]
    );

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No financial data found" });
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error fetching financial data:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
