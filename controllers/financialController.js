const { pool } = require('../config/db');
const logger = require('../utils/logger');

exports.getFinancialSummary = async (req, res) => {
  const { user_id } = req.params;

  try {
    logger.debug("Fetching financial summary for user:", { userId: user_id });

    // Get detailed financial data
    const queries = {
      income: `
        SELECT amount, category, timestamp 
        FROM incomes 
        WHERE user_id = ?
        ORDER BY timestamp DESC
      `,
      expenses: `
        SELECT amount, category, timestamp 
        FROM expenses 
        WHERE user_id = ?
        ORDER BY timestamp DESC
      `
    };

    // Execute queries in parallel
    const [incomeResults, expenseResults] = await Promise.all([
      pool.query(queries.income, [user_id]),
      pool.query(queries.expenses, [user_id])
    ]);

    // Get the raw data
    const incomes = incomeResults[0];
    const expenses = expenseResults[0];

    // Calculate totals
    const totalIncome = incomes.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    
    // Calculate investment income (counts as savings)
    const investmentIncome = incomes
      .filter(inc => inc.category === 'investment')
      .reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);

    // Calculate current balance and net savings
    const currentBalance = totalIncome - totalExpenses;
    const netSavings = investmentIncome; // Investment income is considered savings

    // Get latest dates
    const lastIncomeDate = incomes.length > 0 ? incomes[0].timestamp : null;
    const lastExpenseDate = expenses.length > 0 ? expenses[0].timestamp : null;

    // Prepare summary
    const summary = {
      total_income: totalIncome,
      total_expenses: totalExpenses,
      current_balance: currentBalance,
      net_savings: netSavings,
      last_income_date: lastIncomeDate,
      last_expense_date: lastExpenseDate,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Log detailed breakdown
    logger.debug("Financial Summary Details:", {
      userId: user_id,
      incomeCount: incomes.length,
      expenseCount: expenses.length,
      calculations: {
        totalIncome,
        totalExpenses,
        currentBalance,
        investmentIncome,
        netSavings
      },
      incomeBreakdown: incomes.map(inc => ({
        amount: inc.amount,
        category: inc.category
      })),
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
      sql: error.sql,
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
    logger.debug("Fetching transaction history:", {
      userId: user_id,
      filters: { start_date, end_date, type, category },
      pagination: { limit, offset }
    });

    // Get incomes
    const incomeQuery = `
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
      ${start_date ? 'AND timestamp >= ?' : ''}
      ${end_date ? 'AND timestamp <= ?' : ''}
      ${category ? 'AND category = ?' : ''}
    `;

    // Get expenses
    const expenseQuery = `
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
      ${start_date ? 'AND timestamp >= ?' : ''}
      ${end_date ? 'AND timestamp <= ?' : ''}
      ${category ? 'AND category = ?' : ''}
    `;

    // Build params for each query
    const incomeParams = [user_id];
    const expenseParams = [user_id];
    if (start_date) {
      incomeParams.push(start_date);
      expenseParams.push(start_date);
    }
    if (end_date) {
      incomeParams.push(end_date);
      expenseParams.push(end_date);
    }
    if (category) {
      incomeParams.push(category);
      expenseParams.push(category);
    }

    // Execute queries
    let [incomes, expenses] = await Promise.all([
      pool.query(incomeQuery, incomeParams),
      pool.query(expenseQuery, expenseParams)
    ]);

    // Get just the rows from the results
    incomes = incomes[0];
    expenses = expenses[0];

    // Filter by type if specified
    let transactions = [];
    if (!type || type === 'income') {
      transactions.push(...incomes);
    }
    if (!type || type === 'expense') {
      transactions.push(...expenses);
    }

    // Sort by timestamp
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Get total count
    const totalCount = transactions.length;

    // Apply pagination
    const paginatedTransactions = transactions.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Format transactions
    const formattedTransactions = paginatedTransactions.map(tx => ({
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
      totalTransactions: totalCount,
      returnedTransactions: formattedTransactions.length,
      filters: { start_date, end_date, type, category }
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
      sql: error.sql,
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

    const [results] = await pool.query(query, [user_id, transaction_id]);

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
