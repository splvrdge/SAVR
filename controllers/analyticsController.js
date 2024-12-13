const db = require("../config/db");

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

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching expense analytics:', error);
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

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching income analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch income analytics'
    });
  }
};

exports.getMonthlyTrends = async (req, res) => {
  const { user_id } = req.params;
  const { year } = req.query;

  try {
    const currentYear = year || new Date().getFullYear();
    
    const query = `
      SELECT 
        DATE_FORMAT(timestamp, '%Y-%m') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        COUNT(DISTINCT CASE WHEN type = 'income' THEN id END) as income_count,
        COUNT(DISTINCT CASE WHEN type = 'expense' THEN id END) as expense_count
      FROM user_financial_data
      WHERE user_id = ? 
      AND YEAR(timestamp) = ?
      GROUP BY DATE_FORMAT(timestamp, '%Y-%m')
      ORDER BY month ASC
    `;

    const [results] = await db.execute(query, [user_id, currentYear]);
    
    const formattedData = results.map(item => ({
      month: item.month,
      total_income: parseFloat(item.total_income) || 0,
      total_expenses: parseFloat(item.total_expenses) || 0,
      income_count: parseInt(item.income_count) || 0,
      expense_count: parseInt(item.expense_count) || 0,
      net: parseFloat(item.total_income - item.total_expenses) || 0
    }));

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly trends'
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

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching expenses by date:', error);
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

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching income by date:', error);
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

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching budget:', error);
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

    res.json({
      success: true,
      data: {
        total_income: results[0].total_income,
        total_expenses: results[0].total_expenses,
        savings: savings
      }
    });
  } catch (error) {
    console.error('Error calculating savings:', error);
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

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching expenses by tag:', error);
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

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching income by tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch income by tag'
    });
  }
};
