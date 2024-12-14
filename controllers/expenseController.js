const db = require("../config/db");
const logger = require("../utils/logger");

exports.addExpense = async (req, res) => {
  const { user_id, amount, description, category } = req.body;

  // Check if requesting user matches the user_id
  if (req.user.user_id != user_id) {
    logger.warn('Unauthorized access attempt:', { 
      requestingUserId: req.user.user_id, 
      targetUserId: user_id 
    });
    return res.status(403).json({ 
      success: false, 
      message: "You are not authorized to add expenses for this user" 
    });
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // First insert into expenses table
    const insertExpenseQuery = `
      INSERT INTO expenses (user_id, amount, description, category, timestamp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [expenseResult] = await connection.execute(insertExpenseQuery, [
      user_id,
      amount,
      description,
      category,
      timestamp,
      timestamp,
      timestamp
    ]);
    const expense_id = expenseResult.insertId;

    // Then insert into user_financial_data with the expense_id reference
    const insertDataQuery = `
      INSERT INTO user_financial_data (user_id, expense_id, amount, description, category, type, timestamp)
      VALUES (?, ?, ?, ?, ?, 'expense', ?)
    `;
    await connection.execute(insertDataQuery, [
      user_id,
      expense_id,
      amount,
      description,
      category,
      timestamp
    ]);

    // Update financial summary with new fields
    const updateSummaryQuery = `
      INSERT INTO user_financial_summary (
        user_id, 
        current_balance, 
        total_expenses,
        last_expense_date
      )
      VALUES (?, -?, ?, ?)
      ON DUPLICATE KEY UPDATE
        current_balance = current_balance - ?,
        total_expenses = total_expenses + ?,
        last_expense_date = ?
    `;
    await connection.execute(updateSummaryQuery, [
      user_id, 
      amount, 
      amount, 
      timestamp,
      amount,
      amount,
      timestamp
    ]);

    await connection.commit();
    logger.info(`Expense added successfully for user ${user_id}`);
    res.status(201).json({ success: true, message: "Expense added successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error('Failed to add expense:', { userId: user_id, error: err.message });
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.getExpenses = async (req, res) => {
  const { user_id } = req.params;

  // Check if requesting user matches the user_id
  if (req.user.user_id != user_id) {
    logger.warn('Unauthorized access attempt:', { 
      requestingUserId: req.user.user_id, 
      targetUserId: user_id 
    });
    return res.status(403).json({ 
      success: false, 
      message: "You are not authorized to view these expenses" 
    });
  }

  const query = `
    SELECT 
      e.expense_id as id,
      e.user_id,
      e.amount,
      e.description,
      e.category,
      e.timestamp,
      e.created_at,
      e.updated_at,
      'expense' as type
    FROM expenses e
    WHERE e.user_id = ?
    ORDER BY e.timestamp DESC
  `;

  try {
    const [results] = await db.execute(query, [user_id]);
    
    const formattedResults = results.map(item => ({
      id: item.id,
      amount: parseFloat(item.amount),
      description: item.description || '',
      category: item.category || 'Other',
      timestamp: item.timestamp,
      created_at: item.created_at,
      updated_at: item.updated_at,
      type: item.type
    }));

    logger.debug(`Retrieved ${formattedResults.length} expenses for user ${user_id}`);
    res.json({ success: true, data: formattedResults });
  } catch (err) {
    logger.error('Failed to get expenses:', { userId: user_id, error: err.message });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateExpense = async (req, res) => {
  const { expense_id, amount, description, category, user_id } = req.body;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get the old amount
    const getOldAmountQuery = `
      SELECT amount FROM expenses 
      WHERE expense_id = ?
    `;
    const [oldAmountResult] = await connection.execute(getOldAmountQuery, [expense_id]);
    if (!oldAmountResult.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    const oldAmount = oldAmountResult[0].amount;

    // Update the expense in both tables
    const updateExpenseQuery = `
      UPDATE expenses 
      SET amount = ?, description = ?, category = ?, updated_at = ? 
      WHERE expense_id = ?
    `;
    await connection.execute(updateExpenseQuery, [amount, description, category, new Date().toISOString().slice(0, 19).replace('T', ' '), expense_id]);

    const updateDataQuery = `
      UPDATE user_financial_data 
      SET amount = ?, description = ?, category = ? 
      WHERE expense_id = ?
    `;
    await connection.execute(updateDataQuery, [amount, description, category, expense_id]);

    // Update the summary
    const updateSummaryQuery = `
      UPDATE user_financial_summary 
      SET 
        current_balance = current_balance + ? - ?,
        total_expenses = total_expenses - ? + ?,
        last_expense_date = ?
      WHERE user_id = ?
    `;
    await connection.execute(updateSummaryQuery, [oldAmount, amount, oldAmount, amount, new Date().toISOString().slice(0, 19).replace('T', ' '), user_id]);

    await connection.commit();
    logger.info(`Expense ${expense_id} updated successfully for user ${user_id}`);
    res.json({ success: true, message: "Expense updated successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error('Failed to update expense:', { expenseId: expense_id, error: err.message });
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.deleteExpense = async (req, res) => {
  const { expense_id } = req.params;
  
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get the amount and user_id for updating the summary
    const getExpenseQuery = `
      SELECT amount, user_id FROM expenses 
      WHERE expense_id = ?
    `;
    const [expenseResult] = await connection.execute(getExpenseQuery, [expense_id]);
    
    if (!expenseResult.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const { amount, user_id } = expenseResult[0];

    // Delete from user_financial_data first (due to foreign key)
    const deleteDataQuery = `
      DELETE FROM user_financial_data 
      WHERE expense_id = ?
    `;
    await connection.execute(deleteDataQuery, [expense_id]);

    // Delete from expenses
    const deleteExpenseQuery = `
      DELETE FROM expenses 
      WHERE expense_id = ?
    `;
    await connection.execute(deleteExpenseQuery, [expense_id]);

    // Update the summary
    const updateSummaryQuery = `
      UPDATE user_financial_summary 
      SET 
        current_balance = current_balance + ?,
        total_expenses = total_expenses - ?,
        last_expense_date = ?
      WHERE user_id = ?
    `;
    await connection.execute(updateSummaryQuery, [amount, amount, new Date().toISOString().slice(0, 19).replace('T', ' '), user_id]);

    await connection.commit();
    logger.info(`Expense ${expense_id} deleted successfully for user ${user_id}`);
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error('Failed to delete expense:', { expenseId: expense_id, error: err.message });
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};
