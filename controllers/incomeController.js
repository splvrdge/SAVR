const db = require("../config/db");
const logger = require("../utils/logger");

exports.addIncome = async (req, res) => {
  const { user_id, amount, description, category } = req.body;
  
  // Check if requesting user matches the user_id
  if (req.user.user_id != user_id) {
    logger.warn('Unauthorized access attempt:', { 
      requestingUserId: req.user.user_id, 
      targetUserId: user_id 
    });
    return res.status(403).json({ 
      success: false, 
      message: "You are not authorized to add income for this user" 
    });
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // First insert into incomes table
    const insertIncomeQuery = `
      INSERT INTO incomes (user_id, amount, description, category, timestamp, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [incomeResult] = await connection.execute(insertIncomeQuery, [
      user_id,
      amount,
      description,
      category,
      timestamp,
      timestamp,
      timestamp
    ]);
    const income_id = incomeResult.insertId;

    // Then insert into user_financial_data with the income_id reference
    const insertDataQuery = `
      INSERT INTO user_financial_data (user_id, income_id, amount, description, category, type, timestamp)
      VALUES (?, ?, ?, ?, ?, 'income', ?)
    `;
    await connection.execute(insertDataQuery, [
      user_id,
      income_id,
      amount,
      description,
      category,
      timestamp
    ]);

    // Update financial summary
    const updateSummaryQuery = `
      INSERT INTO user_financial_summary (
        user_id, 
        current_balance, 
        total_income,
        last_income_date
      )
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        current_balance = current_balance + ?,
        total_income = total_income + ?,
        last_income_date = ?
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
    logger.info(`Income added successfully for user ${user_id}`);
    res.status(201).json({ success: true, message: "Income added successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error('Failed to add income:', { userId: user_id, error: err.message });
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.getIncomes = async (req, res) => {
  const { user_id } = req.params;
  
  // Check if requesting user matches the user_id
  if (req.user.user_id != user_id) {
    logger.warn('Unauthorized access attempt:', { 
      requestingUserId: req.user.user_id, 
      targetUserId: user_id 
    });
    return res.status(403).json({ 
      success: false, 
      message: "You are not authorized to view these incomes" 
    });
  }

  const query = `
    SELECT 
      i.income_id as id,
      i.user_id,
      i.amount,
      i.description,
      i.category,
      i.timestamp,
      i.created_at,
      i.updated_at,
      'income' as type
    FROM incomes i
    WHERE i.user_id = ?
    ORDER BY i.timestamp DESC
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

    logger.debug(`Retrieved ${formattedResults.length} incomes for user ${user_id}`);
    res.json({ success: true, data: formattedResults });
  } catch (err) {
    logger.error('Failed to get incomes:', { userId: user_id, error: err.message });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateIncome = async (req, res) => {
  const { id } = req.params;
  const { amount, description, category } = req.body;
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get the original income to calculate the difference
    const [originalIncome] = await connection.execute(
      'SELECT amount, user_id FROM incomes WHERE income_id = ?',
      [id]
    );

    if (originalIncome.length === 0) {
      await connection.rollback();
      logger.warn(`Update attempted on non-existent income: ${id}`);
      return res.status(404).json({ success: false, message: "Income not found" });
    }

    const amountDifference = amount - originalIncome[0].amount;
    const user_id = originalIncome[0].user_id;

    // Update the income
    await connection.execute(
      `UPDATE incomes 
       SET amount = ?, description = ?, category = ?, updated_at = ?
       WHERE income_id = ?`,
      [amount, description, category, timestamp, id]
    );

    // Update the financial data
    await connection.execute(
      `UPDATE user_financial_data 
       SET amount = ?, description = ?, category = ?
       WHERE income_id = ?`,
      [amount, description, category, id]
    );

    // Update the financial summary
    await connection.execute(
      `UPDATE user_financial_summary 
       SET current_balance = current_balance + ?,
           total_income = total_income + ?
       WHERE user_id = ?`,
      [amountDifference, amountDifference, user_id]
    );

    await connection.commit();
    logger.info(`Income ${id} updated successfully for user ${user_id}`);
    res.json({ success: true, message: "Income updated successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error('Failed to update income:', { incomeId: id, error: err.message });
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

exports.deleteIncome = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Get the income details before deletion
    const [income] = await connection.execute(
      'SELECT amount, user_id FROM incomes WHERE income_id = ?',
      [id]
    );

    if (income.length === 0) {
      await connection.rollback();
      logger.warn(`Delete attempted on non-existent income: ${id}`);
      return res.status(404).json({ success: false, message: "Income not found" });
    }

    const { amount, user_id } = income[0];

    // Delete from financial data first (foreign key constraint)
    await connection.execute(
      'DELETE FROM user_financial_data WHERE income_id = ?',
      [id]
    );

    // Delete the income
    await connection.execute(
      'DELETE FROM incomes WHERE income_id = ?',
      [id]
    );

    // Update financial summary
    await connection.execute(
      `UPDATE user_financial_summary 
       SET current_balance = current_balance - ?,
           total_income = total_income - ?
       WHERE user_id = ?`,
      [amount, amount, user_id]
    );

    await connection.commit();
    logger.info(`Income ${id} deleted successfully for user ${user_id}`);
    res.json({ success: true, message: "Income deleted successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error('Failed to delete income:', { incomeId: id, error: err.message });
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};
