const db = require("../config/db");
const logger = require("../utils/logger");

exports.getFinancialSummary = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT 
        current_balance,
        total_income,
        total_expenses,
        last_income_date,
        last_expense_date,
        created_at,
        updated_at
      FROM user_financial_summary
      WHERE user_id = ?
    `;

    const [results] = await db.execute(query, [user_id]);

    if (results.length === 0) {
      logger.warn("Financial summary not found:", { userId: user_id });
      return res.status(404).json({
        success: false,
        message: "Financial summary not found"
      });
    }

    const summary = {
      current_balance: parseFloat(results[0].current_balance),
      total_income: parseFloat(results[0].total_income),
      total_expenses: parseFloat(results[0].total_expenses),
      last_income_date: results[0].last_income_date,
      last_expense_date: results[0].last_expense_date,
      created_at: results[0].created_at,
      updated_at: results[0].updated_at
    };

    logger.debug("Retrieved financial summary:", { 
      userId: user_id,
      hasTransactions: !!(summary.total_income || summary.total_expenses)
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error("Failed to get financial summary:", {
      userId: user_id,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: "Error retrieving financial summary"
    });
  }
};

exports.getTransactionHistory = async (req, res) => {
  const { user_id } = req.params;
  const { start_date, end_date, type, category, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT 
        CASE 
          WHEN type = 'income' THEN income_id 
          ELSE expense_id 
        END as id,
        type,
        amount,
        description,
        category,
        timestamp,
        created_at,
        updated_at
      FROM (
        SELECT 
          income_id,
          NULL as expense_id,
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
          NULL as income_id,
          expense_id,
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
      WHERE 1=1
    `;
    const queryParams = [user_id, user_id];

    if (start_date) {
      query += " AND timestamp >= ?";
      queryParams.push(start_date);
    }
    if (end_date) {
      query += " AND timestamp <= ?";
      queryParams.push(end_date);
    }
    if (type) {
      query += " AND type = ?";
      queryParams.push(type);
    }
    if (category) {
      query += " AND category = ?";
      queryParams.push(category);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT.*?FROM/s,
      "SELECT COUNT(*) as total FROM"
    );
    const [countResults] = await db.execute(countQuery, queryParams);
    const totalCount = countResults[0].total;

    // Add pagination
    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));

    const [results] = await db.execute(query, queryParams);

    if (results.length === 0) {
      logger.debug("No transaction history found:", { userId: user_id });
      return res.status(404).json({
        success: false,
        message: "No financial data found"
      });
    }

    const transactions = results.map(tx => ({
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
      filters: {
        startDate: start_date,
        endDate: end_date,
        type,
        category
      },
      pagination: {
        limit,
        offset,
        total: totalCount,
        returned: transactions.length
      }
    });

    res.json({
      success: true,
      data: {
        transactions,
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
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: "Error retrieving transaction history"
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
