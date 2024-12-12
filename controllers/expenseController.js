const db = require("../config/db");

exports.addExpense = async (req, res) => {
  const { user_id, amount, description, category } = req.body;
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert into user_financial_data
    const insertQuery = `
      INSERT INTO user_financial_data (user_id, amount, description, category, type, timestamp)
      VALUES (?, ?, ?, ?, 'expense', ?)
    `;
    await connection.execute(insertQuery, [user_id, amount, description, category, timestamp]);

    // Update financial summary
    const updateSummaryQuery = `
      INSERT INTO user_financial_summary (user_id, current_balance, total_expenses)
      VALUES (?, -?, ?)
      ON DUPLICATE KEY UPDATE
      current_balance = current_balance - ?,
      total_expenses = total_expenses + ?
    `;
    await connection.execute(updateSummaryQuery, [user_id, amount, amount, amount, amount]);

    await connection.commit();
    res.status(201).json({ success: true, message: "Expense added successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Error adding expense:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.updateExpense = async (req, res) => {
  const { expense_id, amount, description, category, user_id } = req.body;
  
  // First, get the old amount to update the summary
  const getOldAmountQuery = `
    SELECT amount FROM user_financial_data 
    WHERE id = ? AND type = 'expense'
  `;
  
  const updateExpenseQuery = `
    UPDATE user_financial_data 
    SET amount = ?, description = ?, category = ? 
    WHERE id = ? AND type = 'expense'
  `;

  const updateSummaryQuery = `
    UPDATE user_financial_summary 
    SET 
      current_balance = current_balance + ? - ?,
      total_expenses = total_expenses - ? + ?,
      last_updated = NOW()
    WHERE user_id = ?
  `;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get the old amount
    const [oldAmountResult] = await connection.execute(getOldAmountQuery, [expense_id]);
    if (!oldAmountResult.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    const oldAmount = oldAmountResult[0].amount;

    // Update the expense
    await connection.execute(updateExpenseQuery, [amount, description, category, expense_id]);

    // Update the summary
    await connection.execute(updateSummaryQuery, [oldAmount, amount, oldAmount, amount, user_id]);

    await connection.commit();
    res.json({ success: true, message: "Expense updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Error updating expense:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.deleteExpense = async (req, res) => {
  const { expense_id } = req.params;
  
  // First, get the amount to update the summary
  const getAmountQuery = `
    SELECT amount, user_id FROM user_financial_data 
    WHERE id = ? AND type = 'expense'
  `;
  
  const deleteExpenseQuery = `
    DELETE FROM user_financial_data 
    WHERE id = ? AND type = 'expense'
  `;

  const updateSummaryQuery = `
    UPDATE user_financial_summary 
    SET 
      current_balance = current_balance + ?,
      total_expenses = total_expenses - ?,
      last_updated = NOW()
    WHERE user_id = ?
  `;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get the amount and user_id
    const [amountResult] = await connection.execute(getAmountQuery, [expense_id]);
    if (!amountResult.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    const { amount, user_id } = amountResult[0];

    // Delete the expense
    await connection.execute(deleteExpenseQuery, [expense_id]);

    // Update the summary
    await connection.execute(updateSummaryQuery, [amount, amount, user_id]);

    await connection.commit();
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting expense:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.getExpenses = async (req, res) => {
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
    WHERE user_id = ? AND type = 'expense'
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
    console.error("Error fetching expenses:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
