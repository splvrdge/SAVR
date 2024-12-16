const db = require("../config/db");
const logger = require("../utils/logger");

exports.getFinancialSummary = async (req, res) => {
  const { user_id } = req.params;

  try {
    logger.debug("Fetching financial summary for user:", { userId: user_id });

    // Calculate latest totals from incomes and expenses
    const updateQuery = `
      UPDATE user_financial_summary ufs
      SET 
        total_income = (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = ?),
        total_expenses = (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ?),
        current_balance = (
          SELECT 
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
          FROM user_financial_data 
          WHERE user_id = ?
        ),
        last_income_date = (SELECT MAX(timestamp) FROM incomes WHERE user_id = ?),
        last_expense_date = (SELECT MAX(timestamp) FROM expenses WHERE user_id = ?),
        updated_at = NOW()
      WHERE user_id = ?;
    `;

    // Insert if not exists
    const insertQuery = `
      INSERT IGNORE INTO user_financial_summary 
        (user_id, total_income, total_expenses, current_balance, last_income_date, last_expense_date)
      SELECT 
        ?,
        COALESCE((SELECT SUM(amount) FROM incomes WHERE user_id = ?), 0),
        COALESCE((SELECT SUM(amount) FROM expenses WHERE user_id = ?), 0),
        COALESCE(
          (SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END)
           FROM user_financial_data 
           WHERE user_id = ?), 
          0
        ),
        (SELECT MAX(timestamp) FROM incomes WHERE user_id = ?),
        (SELECT MAX(timestamp) FROM expenses WHERE user_id = ?)
    `;

    // Execute both queries in sequence
    await db.execute(insertQuery, [user_id, user_id, user_id, user_id, user_id, user_id]);
    await db.execute(updateQuery, [user_id, user_id, user_id, user_id, user_id, user_id]);

    // Fetch the updated summary
    const selectQuery = `
      SELECT 
        total_income,
        total_expenses,
        current_balance,
        net_savings,
        last_income_date,
        last_expense_date,
        created_at,
        updated_at
      FROM user_financial_summary
      WHERE user_id = ?
    `;

    const [results] = await db.execute(selectQuery, [user_id]);

    if (results.length === 0) {
      logger.error("Financial summary not found after insert/update:", { userId: user_id });
      return res.status(500).json({
        success: false,
        message: "Error retrieving financial summary"
      });
    }

    const summary = {
      total_income: parseFloat(results[0].total_income || 0),
      total_expenses: parseFloat(results[0].total_expenses || 0),
      current_balance: parseFloat(results[0].current_balance || 0),
      net_savings: parseFloat(results[0].net_savings || 0),
      last_income_date: results[0].last_income_date,
      last_expense_date: results[0].last_expense_date,
      created_at: results[0].created_at,
      updated_at: results[0].updated_at
    };

    logger.debug("Retrieved financial summary:", { 
      userId: user_id,
      summary
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error("Failed to get financial summary:", {
      userId: user_id,
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: "Error retrieving financial summary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

exports.getTransactionHistory = async (req, res) => {
  const { user_id } = req.params;
  const { start_date, end_date, type, category, limit = 50, offset = 0 } = req.query;

  try {
    // Build the base query
    let query = `
      SELECT 
        id,
        type,
        amount,
        description,
        category,
        timestamp,
        created_at,
        updated_at
      FROM (
        SELECT 
          income_id as id,
          'income' as type,
          amount,
          description,
          category,
          timestamp,
          created_at,
          updated_at
        FROM incomes
        WHERE user_id = ?
        
        UNION ALL
        
        SELECT 
          expense_id as id,
          'expense' as type,
          amount,
          description,
          category,
          timestamp,
          created_at,
          updated_at
        FROM expenses
        WHERE user_id = ?
      ) as transactions
    `;

    const params = [user_id, user_id];

    // Add filters
    const filters = [];
    if (start_date) {
      filters.push('timestamp >= ?');
      params.push(start_date);
    }
    if (end_date) {
      filters.push('timestamp <= ?');
      params.push(end_date);
    }
    if (type) {
      filters.push('type = ?');
      params.push(type);
    }
    if (category) {
      filters.push('category = ?');
      params.push(category);
    }

    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ');
    }

    // Add sorting and pagination
    query += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    // Get total count (without pagination)
    const countQuery = `
      SELECT COUNT(*) as total FROM (${query.split('ORDER BY')[0]}) as filtered
    `;
    const [countResults] = await db.execute(countQuery, params.slice(0, -2));
    const totalCount = countResults[0].total;

    // Execute main query
    const [transactions] = await db.execute(query, params);

    if (transactions.length === 0) {
      logger.debug("No transaction history found:", { 
        userId: user_id,
        filters: { start_date, end_date, type, category }
      });
      return res.json({
        success: true,
        data: {
          transactions: [],
          pagination: {
            total: 0,
            limit: parseInt(limit),
            offset: parseInt(offset)
          }
        }
      });
    }

    // Format transactions
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: parseFloat(tx.amount),
      description: tx.description,
      category: tx.category,
      timestamp: tx.timestamp,
      created_at: tx.created_at,
      updated_at: tx.updated_at
    }));

    logger.debug("Retrieved transaction history:", {
      userId: user_id,
      filters: { start_date, end_date, type, category },
      pagination: {
        limit,
        offset,
        total: totalCount,
        returned: formattedTransactions.length
      }
    });

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: totalCount,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      }
    });
  } catch (error) {
    logger.error("Failed to get transaction history:", {
      userId: user_id,
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: "Error retrieving transaction history",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

exports.getTransactionDetails = async (req, res) => {
  const { user_id, transaction_id } = req.params;

  try {
    const query = `
      SELECT 
        id,
        type,
        amount,
        description,
        category,
        timestamp,
        created_at,
        updated_at
      FROM user_financial_data
      WHERE user_id = ? AND id = ?
    `;

    const [results] = await db.execute(query, [user_id, transaction_id]);

    if (results.length === 0) {
      logger.warn("Transaction not found:", { 
        userId: user_id, 
        transactionId: transaction_id 
      });
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const transaction = {
      id: results[0].id,
      type: results[0].type,
      amount: parseFloat(results[0].amount),
      description: results[0].description,
      category: results[0].category,
      timestamp: results[0].timestamp,
      created_at: results[0].created_at,
      updated_at: results[0].updated_at
    };

    logger.debug("Retrieved transaction details:", {
      userId: user_id,
      transactionId: transaction_id,
      type: transaction.type
    });

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    logger.error("Failed to get transaction details:", {
      userId: user_id,
      transactionId: transaction_id,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: "Error retrieving transaction details"
    });
  }
};
