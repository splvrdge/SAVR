const db = require("../config/db");

exports.addIncome = async (req, res) => {
  const { user_id, amount, description, category } = req.body;
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert into user_financial_data
    const insertQuery = `
      INSERT INTO user_financial_data (user_id, amount, description, category, type, timestamp)
      VALUES (?, ?, ?, ?, 'income', ?)
    `;
    await connection.execute(insertQuery, [user_id, amount, description, category, timestamp]);

    // Update financial summary
    const updateSummaryQuery = `
      INSERT INTO user_financial_summary (user_id, current_balance, net_savings)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      current_balance = current_balance + ?,
      net_savings = net_savings + ?
    `;
    await connection.execute(updateSummaryQuery, [user_id, amount, amount, amount, amount]);

    await connection.commit();
    res.status(201).json({ success: true, message: "Income added successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Error adding income:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.getIncomes = async (req, res) => {
  const { user_id } = req.params;
  const query = `
    SELECT 
      id,
      amount,
      description,
      category,
      timestamp,
      type
    FROM user_financial_data 
    WHERE user_id = ? AND type = 'income'
    ORDER BY timestamp DESC
  `;

  try {
    const [results] = await db.execute(query, [user_id]);
    
    // Map the results to match the frontend's expected format
    const formattedResults = results.map(item => ({
      id: item.id,
      amount: parseFloat(item.amount),
      description: item.description || '',
      category: item.category || 'Other',
      timestamp: item.timestamp,
      type: item.type
    }));
    
    res.json({ 
      success: true, 
      data: formattedResults 
    });
  } catch (err) {
    console.error("Error fetching incomes:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateIncome = async (req, res) => {
  const { income_id, amount, description, category } = req.body;
  
  // First, get the old amount to update the summary
  const getOldAmountQuery = `
    SELECT amount FROM user_financial_data 
    WHERE id = ? AND type = 'income'
  `;
  
  const updateIncomeQuery = `
    UPDATE user_financial_data 
    SET amount = ?, description = ?, category = ? 
    WHERE id = ? AND type = 'income'
  `;

  const updateSummaryQuery = `
    UPDATE user_financial_summary 
    SET 
      current_balance = current_balance - ? + ?,
      net_savings = net_savings - ? + ?,
      last_updated = NOW()
    WHERE user_id = ?
  `;

  try {
    // Get the old amount
    const [oldAmountResult] = await db.execute(getOldAmountQuery, [income_id]);
    if (!oldAmountResult.length) {
      return res.status(404).json({ success: false, message: "Income not found" });
    }
    const oldAmount = oldAmountResult[0].amount;

    // Update the income
    await db.execute(updateIncomeQuery, [amount, description, category, income_id]);

    // Update the summary
    const userId = req.user.user_id; // Assuming user ID is attached by auth middleware
    await db.execute(updateSummaryQuery, [oldAmount, amount, oldAmount, amount, userId]);

    res.json({ success: true, message: "Income updated successfully" });
  } catch (err) {
    console.error("Error updating income:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteIncome = async (req, res) => {
  const { income_id } = req.params;
  
  // First, get the amount to update the summary
  const getAmountQuery = `
    SELECT amount, user_id FROM user_financial_data 
    WHERE id = ? AND type = 'income'
  `;
  
  const deleteIncomeQuery = `
    DELETE FROM user_financial_data 
    WHERE id = ? AND type = 'income'
  `;

  const updateSummaryQuery = `
    UPDATE user_financial_summary 
    SET 
      current_balance = current_balance - ?,
      net_savings = net_savings - ?,
      last_updated = NOW()
    WHERE user_id = ?
  `;

  try {
    // Get the amount and user_id
    const [amountResult] = await db.execute(getAmountQuery, [income_id]);
    if (!amountResult.length) {
      return res.status(404).json({ success: false, message: "Income not found" });
    }
    const { amount, user_id } = amountResult[0];

    // Delete the income
    await db.execute(deleteIncomeQuery, [income_id]);

    // Update the summary
    await db.execute(updateSummaryQuery, [amount, amount, user_id]);

    res.json({ success: true, message: "Income deleted successfully" });
  } catch (err) {
    console.error("Error deleting income:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
