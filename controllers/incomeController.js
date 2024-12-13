const db = require("../config/db");

exports.addIncome = async (req, res) => {
  const { user_id, amount, description, category } = req.body;
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

  console.log('Adding income with data:', { user_id, amount, description, category, timestamp });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

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

    console.log('Income inserted with ID:', income_id);

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

    console.log('Financial data inserted');

    const updateSummaryQuery = `
      INSERT INTO user_financial_summary (
        user_id, 
        current_balance, 
        total_income,
        net_savings,
        last_income_date
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        current_balance = current_balance + ?,
        total_income = total_income + ?,
        net_savings = net_savings + ?,
        last_income_date = ?
    `;
    await connection.execute(updateSummaryQuery, [
      user_id, 
      amount, 
      amount,
      amount,
      timestamp,
      amount,
      amount,
      amount,
      timestamp
    ]);

    console.log('Financial summary updated');

    await connection.commit();
    res.status(201).json({ 
      success: true, 
      message: "Income added successfully",
      data: {
        income_id,
        user_id,
        amount,
        description,
        category,
        timestamp
      }
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error adding income:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to add income", 
      error: err.message 
    });
  } finally {
    connection.release();
  }
};

exports.getIncomes = async (req, res) => {
  const { user_id } = req.params;
  console.log('Fetching incomes for user:', user_id);

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
    
    console.log('Incomes fetched:', results.length);

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
    
    res.json({ 
      success: true, 
      data: formattedResults 
    });
  } catch (err) {
    console.error("Error fetching incomes:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch incomes", 
      error: err.message 
    });
  }
};

exports.updateIncome = async (req, res) => {
  const { income_id, amount, description, category, user_id } = req.body;
  console.log('Updating income with ID:', income_id);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const getOldAmountQuery = `
      SELECT amount FROM incomes 
      WHERE income_id = ?
    `;
    const [oldAmountResult] = await connection.execute(getOldAmountQuery, [income_id]);
    if (!oldAmountResult.length) {
      await connection.rollback();
      console.log('Income not found:', income_id);
      return res.status(404).json({ 
        success: false, 
        message: "Income not found" 
      });
    }
    const oldAmount = oldAmountResult[0].amount;

    console.log('Old amount:', oldAmount);

    const updateIncomeQuery = `
      UPDATE incomes 
      SET amount = ?, description = ?, category = ?, updated_at = NOW() 
      WHERE income_id = ?
    `;
    await connection.execute(updateIncomeQuery, [amount, description, category, income_id]);

    console.log('Income updated');

    const updateDataQuery = `
      UPDATE user_financial_data 
      SET amount = ?, description = ?, category = ? 
      WHERE income_id = ?
    `;
    await connection.execute(updateDataQuery, [amount, description, category, income_id]);

    console.log('Financial data updated');

    const updateSummaryQuery = `
      UPDATE user_financial_summary 
      SET 
        current_balance = current_balance - ? + ?,
        total_income = total_income - ? + ?,
        net_savings = net_savings - ? + ?,
        last_income_date = NOW()
      WHERE user_id = ?
    `;
    await connection.execute(updateSummaryQuery, [oldAmount, amount, oldAmount, amount, oldAmount, amount, user_id]);

    console.log('Financial summary updated');

    await connection.commit();
    res.json({ 
      success: true, 
      message: "Income updated successfully" 
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error updating income:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update income", 
      error: err.message 
    });
  } finally {
    connection.release();
  }
};

exports.deleteIncome = async (req, res) => {
  const { income_id } = req.params;
  console.log('Deleting income with ID:', income_id);

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const getIncomeQuery = `
      SELECT amount, user_id FROM incomes 
      WHERE income_id = ?
    `;
    const [incomeResult] = await connection.execute(getIncomeQuery, [income_id]);
    
    if (!incomeResult.length) {
      await connection.rollback();
      console.log('Income not found:', income_id);
      return res.status(404).json({ 
        success: false, 
        message: "Income not found" 
      });
    }

    const { amount, user_id } = incomeResult[0];

    console.log('Income found:', income_id);

    const deleteDataQuery = `
      DELETE FROM user_financial_data 
      WHERE income_id = ?
    `;
    await connection.execute(deleteDataQuery, [income_id]);

    console.log('Financial data deleted');

    const deleteIncomeQuery = `
      DELETE FROM incomes 
      WHERE income_id = ?
    `;
    await connection.execute(deleteIncomeQuery, [income_id]);

    console.log('Income deleted');

    const updateSummaryQuery = `
      UPDATE user_financial_summary 
      SET 
        current_balance = current_balance - ?,
        total_income = total_income - ?,
        net_savings = net_savings - ?,
        last_income_date = NULL
      WHERE user_id = ?
    `;
    await connection.execute(updateSummaryQuery, [amount, amount, amount, user_id]);

    console.log('Financial summary updated');

    await connection.commit();
    res.json({ 
      success: true, 
      message: "Income deleted successfully" 
    });
  } catch (err) {
    await connection.rollback();
    console.error("Error deleting income:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete income", 
      error: err.message 
    });
  } finally {
    connection.release();
  }
};
