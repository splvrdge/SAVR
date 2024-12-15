INSERT INTO budgets (user_id, category, budget_limit)
VALUES 
  ({{user_id}}, 'Food', 500.00),
  ({{user_id}}, 'Transportation', 300.00),
  ({{user_id}}, 'Entertainment', 200.00);
