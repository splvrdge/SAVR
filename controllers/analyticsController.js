const db = require("../config/db");
const logger = require("../utils/logger");

exports.getExpensesByCategory = async (req, res) => {
  const { user_id } = req.params;
  const { timeframe, date, year } = req.query;

  try {
    let dateFilter = '';
    let params = [user_id];

    if (timeframe === 'week' && date) {
      dateFilter = `AND DATE(e.timestamp) = DATE(?)`;
      params.push(date);
    } else if (timeframe === 'month' && date) {
      dateFilter = `AND DATE_FORMAT(e.timestamp, '%Y-%m') = ?`;
      params.push(date);
    } else if (timeframe === 'year' && year) {
      dateFilter = `AND YEAR(e.timestamp) = ?`;
      params.push(year);
    } else {
      dateFilter = 'AND e.timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    const query = `
      SELECT 
        e.category,
        SUM(e.amount) as total_amount,
        COUNT(*) as transaction_count,
        ROUND((SUM(e.amount) / NULLIF((
          SELECT SUM(amount)
          FROM expenses 
          WHERE user_id = ? ${dateFilter.replace('e.', '')}
        ), 0)) * 100, 2) as percentage
      FROM expenses e
      WHERE e.user_id = ? ${dateFilter}
      GROUP BY e.category
      ORDER BY total_amount DESC
    `;

    params = [...params, ...params];
    const [results] = await db.execute(query, params);
    
    const formattedData = results.map(item => ({
      category: item.category || 'Uncategorized',
      total_amount: parseFloat(item.total_amount) || 0,
      transaction_count: parseInt(item.transaction_count) || 0,
      percentage: parseFloat(item.percentage) || 0
    }));

    logger.debug('Retrieved expenses by category:', {
      userId: user_id,
      timeframe,
      date,
      year,
      categories: formattedData.length
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    logger.error('Error fetching expense analytics:', {
      userId: user_id,
      timeframe,
      date,
      year,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense analytics'
    });
  }
};

exports.getIncomeByCategory = async (req, res) => {
  const { user_id } = req.params;
  const { timeframe, date, year } = req.query;

  try {
    let dateFilter = '';
    let params = [user_id];

    if (timeframe === 'week' && date) {
      dateFilter = `AND DATE(i.timestamp) = DATE(?)`;
      params.push(date);
    } else if (timeframe === 'month' && date) {
      dateFilter = `AND DATE_FORMAT(i.timestamp, '%Y-%m') = ?`;
      params.push(date);
    } else if (timeframe === 'year' && year) {
      dateFilter = `AND YEAR(i.timestamp) = ?`;
      params.push(year);
    } else {
      dateFilter = 'AND i.timestamp >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    const query = `
      SELECT 
        i.category,
        SUM(i.amount) as total_amount,
        COUNT(*) as transaction_count,
        ROUND((SUM(i.amount) / NULLIF((
          SELECT SUM(amount)
          FROM incomes 
          WHERE user_id = ? ${dateFilter.replace('i.', '')}
        ), 0)) * 100, 2) as percentage
      FROM incomes i
      WHERE i.user_id = ? ${dateFilter}
      GROUP BY i.category
      ORDER BY total_amount DESC
    `;

    params = [...params, ...params];
    const [results] = await db.execute(query, params);
    
    const formattedData = results.map(item => ({
      category: item.category || 'Uncategorized',
      total_amount: parseFloat(item.total_amount) || 0,
      transaction_count: parseInt(item.transaction_count) || 0,
      percentage: parseFloat(item.percentage) || 0
    }));

    logger.debug('Retrieved income by category:', {
      userId: user_id,
      timeframe,
      date,
      year,
      categories: formattedData.length
    });

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    logger.error('Error fetching income analytics:', {
      userId: user_id,
      timeframe,
      date,
      year,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch income analytics'
    });
  }
};

exports.getMonthlyTrends = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
        AVG(CASE WHEN type = 'income' THEN amount END) as avg_income,
        AVG(CASE WHEN type = 'expense' THEN amount END) as avg_expense
      FROM (
        SELECT 'income' as type, amount, timestamp FROM incomes WHERE user_id = ?
        UNION ALL
        SELECT 'expense' as type, amount, timestamp FROM expenses WHERE user_id = ?
      ) as transactions
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12`;

    const [results] = await db.execute(query, [user_id, user_id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No trends data found"
      });
    }

    const trends = results.map(row => ({
      month: row.month,
      total_income: parseFloat(row.total_income || 0),
      total_expenses: parseFloat(row.total_expenses || 0),
      net_savings: parseFloat((row.total_income || 0) - (row.total_expenses || 0)),
      income_count: row.income_count || 0,
      expense_count: row.expense_count || 0,
      avg_income: parseFloat(row.avg_income || 0),
      avg_expense: parseFloat(row.avg_expense || 0)
    }));

    res.json({
      success: true,
      data: {
        trends,
        summary: {
          total_months: trends.length,
          average_monthly_savings: trends.reduce((acc, curr) => acc + curr.net_savings, 0) / trends.length,
          highest_saving_month: trends.reduce((max, curr) => curr.net_savings > max.net_savings ? curr : max, trends[0]),
          lowest_saving_month: trends.reduce((min, curr) => curr.net_savings < min.net_savings ? curr : min, trends[0])
        }
      }
    });
  } catch (error) {
    logger.error("Failed to get monthly trends:", {
      userId: user_id,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      message: "Error retrieving monthly trends"
    });
  }
};

exports.getExpensesByDate = async (req, res) => {
  const { user_id } = req.params;
  const { start_date, end_date } = req.query;

  try {
    const query = `
      SELECT 
        DATE(timestamp) as date,
        SUM(amount) as total_amount
      FROM expenses
      WHERE user_id = ?
        AND timestamp BETWEEN ? AND ?
      GROUP BY DATE(timestamp)
      ORDER BY date`;

    const [results] = await db.query(query, [user_id, start_date || new Date(Date.now() - 30*24*60*60*1000), end_date || new Date()]);

    logger.debug('Retrieved expenses by date:', {
      userId: user_id,
      startDate: start_date,
      endDate: end_date,
      dates: results.length
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error fetching expenses by date:', {
      userId: user_id,
      startDate: start_date,
      endDate: end_date,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses by date'
    });
  }
};

exports.getIncomeByDate = async (req, res) => {
  const { user_id } = req.params;
  const { start_date, end_date } = req.query;

  try {
    const query = `
      SELECT 
        DATE(timestamp) as date,
        SUM(amount) as total_amount
      FROM income
      WHERE user_id = ?
        AND timestamp BETWEEN ? AND ?
      GROUP BY DATE(timestamp)
      ORDER BY date`;

    const [results] = await db.query(query, [user_id, start_date || new Date(Date.now() - 30*24*60*60*1000), end_date || new Date()]);

    logger.debug('Retrieved income by date:', {
      userId: user_id,
      startDate: start_date,
      endDate: end_date,
      dates: results.length
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error fetching income by date:', {
      userId: user_id,
      startDate: start_date,
      endDate: end_date,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch income by date'
    });
  }
};

exports.getBudget = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT 
        category,
        budget_limit,
        (
          SELECT SUM(amount)
          FROM expenses e2
          WHERE e2.category = b.category
          AND e2.user_id = b.user_id
          AND MONTH(e2.timestamp) = MONTH(CURRENT_DATE())
          AND YEAR(e2.timestamp) = YEAR(CURRENT_DATE())
        ) as current_spending
      FROM budgets b
      WHERE user_id = ?`;

    const [results] = await db.query(query, [user_id]);

    logger.debug('Retrieved budget:', {
      userId: user_id,
      categories: results.length
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error fetching budget:', {
      userId: user_id,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget information'
    });
  }
};

exports.getSavings = async (req, res) => {
  const { user_id } = req.params;
  const { timeframe } = req.query;

  try {
    let dateFilter = '';
    if (timeframe === 'month') {
      dateFilter = 'AND MONTH(timestamp) = MONTH(CURRENT_DATE()) AND YEAR(timestamp) = YEAR(CURRENT_DATE())';
    } else if (timeframe === 'year') {
      dateFilter = 'AND YEAR(timestamp) = YEAR(CURRENT_DATE())';
    }

    const query = `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM income WHERE user_id = ? ${dateFilter}) as total_income,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = ? ${dateFilter}) as total_expenses`;

    const [results] = await db.query(query, [user_id, user_id]);
    const savings = results[0].total_income - results[0].total_expenses;

    logger.debug('Calculated savings:', {
      userId: user_id,
      timeframe,
      savings
    });

    res.json({
      success: true,
      data: {
        total_income: results[0].total_income,
        total_expenses: results[0].total_expenses,
        savings: savings
      }
    });
  } catch (error) {
    logger.error('Error calculating savings:', {
      userId: user_id,
      timeframe,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate savings'
    });
  }
};

exports.getExpensesByTag = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT 
        et.tag_name,
        COUNT(*) as transaction_count,
        SUM(e.amount) as total_amount
      FROM expenses e
      JOIN expense_tags et ON e.id = et.expense_id
      WHERE e.user_id = ?
      GROUP BY et.tag_name
      ORDER BY total_amount DESC`;

    const [results] = await db.query(query, [user_id]);

    logger.debug('Retrieved expenses by tag:', {
      userId: user_id,
      tags: results.length
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error fetching expenses by tag:', {
      userId: user_id,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses by tag'
    });
  }
};

exports.getIncomeByTag = async (req, res) => {
  const { user_id } = req.params;

  try {
    const query = `
      SELECT 
        it.tag_name,
        COUNT(*) as transaction_count,
        SUM(i.amount) as total_amount
      FROM income i
      JOIN income_tags it ON i.id = it.income_id
      WHERE i.user_id = ?
      GROUP BY it.tag_name
      ORDER BY total_amount DESC`;

    const [results] = await db.query(query, [user_id]);

    logger.debug('Retrieved income by tag:', {
      userId: user_id,
      tags: results.length
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error fetching income by tag:', {
      userId: user_id,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch income by tag'
    });
  }
};
