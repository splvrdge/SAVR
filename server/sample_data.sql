-- Sample data for incomes (last 3 months)
INSERT INTO incomes (user_id, amount, description, category, timestamp, created_at, updated_at) VALUES
-- December 2023
(1, 50000.00, 'Monthly Salary', 'salary', '2023-12-05 09:00:00', '2023-12-05 09:00:00', '2023-12-05 09:00:00'),
(1, 15000.00, 'Freelance Project', 'freelance', '2023-12-07 14:30:00', '2023-12-07 14:30:00', '2023-12-07 14:30:00'),
(1, 5000.00, 'Stock Dividends', 'investment', '2023-12-10 11:00:00', '2023-12-10 11:00:00', '2023-12-10 11:00:00'),
-- November 2023
(1, 50000.00, 'Monthly Salary', 'salary', '2023-11-05 09:00:00', '2023-11-05 09:00:00', '2023-11-05 09:00:00'),
(1, 20000.00, 'Business Revenue', 'business', '2023-11-15 16:00:00', '2023-11-15 16:00:00', '2023-11-15 16:00:00'),
(1, 10000.00, 'Investment Returns', 'investment', '2023-11-20 13:30:00', '2023-11-20 13:30:00', '2023-11-20 13:30:00'),
-- October 2023
(1, 50000.00, 'Monthly Salary', 'salary', '2023-10-05 09:00:00', '2023-10-05 09:00:00', '2023-10-05 09:00:00'),
(1, 12000.00, 'Freelance Work', 'freelance', '2023-10-12 15:45:00', '2023-10-12 15:45:00', '2023-10-12 15:45:00'),
(1, 8000.00, 'Business Income', 'business', '2023-10-25 10:20:00', '2023-10-25 10:20:00', '2023-10-25 10:20:00');

-- Sample data for expenses (last 3 months)
INSERT INTO expenses (user_id, amount, description, category, timestamp, created_at, updated_at) VALUES
-- December 2023
(1, 15000.00, 'Monthly Rent', 'housing', '2023-12-01 10:00:00', '2023-12-01 10:00:00', '2023-12-01 10:00:00'),
(1, 8000.00, 'Groceries', 'food', '2023-12-03 15:30:00', '2023-12-03 15:30:00', '2023-12-03 15:30:00'),
(1, 5000.00, 'Electricity Bill', 'utilities', '2023-12-05 09:30:00', '2023-12-05 09:30:00', '2023-12-05 09:30:00'),
(1, 3000.00, 'Internet Bill', 'utilities', '2023-12-05 09:35:00', '2023-12-05 09:35:00', '2023-12-05 09:35:00'),
(1, 2000.00, 'Transportation', 'transportation', '2023-12-06 08:00:00', '2023-12-06 08:00:00', '2023-12-06 08:00:00'),
-- November 2023
(1, 15000.00, 'Monthly Rent', 'housing', '2023-11-01 10:00:00', '2023-11-01 10:00:00', '2023-11-01 10:00:00'),
(1, 10000.00, 'Groceries', 'food', '2023-11-05 16:00:00', '2023-11-05 16:00:00', '2023-11-05 16:00:00'),
(1, 5000.00, 'Electricity Bill', 'utilities', '2023-11-06 09:30:00', '2023-11-06 09:30:00', '2023-11-06 09:30:00'),
(1, 3000.00, 'Internet Bill', 'utilities', '2023-11-06 09:35:00', '2023-11-06 09:35:00', '2023-11-06 09:35:00'),
(1, 4000.00, 'Shopping', 'shopping', '2023-11-15 14:20:00', '2023-11-15 14:20:00', '2023-11-15 14:20:00'),
-- October 2023
(1, 15000.00, 'Monthly Rent', 'housing', '2023-10-01 10:00:00', '2023-10-01 10:00:00', '2023-10-01 10:00:00'),
(1, 7000.00, 'Groceries', 'food', '2023-10-04 11:30:00', '2023-10-04 11:30:00', '2023-10-04 11:30:00'),
(1, 4500.00, 'Electricity Bill', 'utilities', '2023-10-05 09:30:00', '2023-10-05 09:30:00', '2023-10-05 09:30:00'),
(1, 3000.00, 'Internet Bill', 'utilities', '2023-10-05 09:35:00', '2023-10-05 09:35:00', '2023-10-05 09:35:00'),
(1, 5000.00, 'Healthcare', 'healthcare', '2023-10-20 15:00:00', '2023-10-20 15:00:00', '2023-10-20 15:00:00');

-- Insert into user_financial_data for incomes
INSERT INTO user_financial_data (user_id, income_id, amount, description, category, type, timestamp)
SELECT user_id, income_id, amount, description, category, 'income', timestamp
FROM incomes
WHERE user_id = 1;

-- Insert into user_financial_data for expenses
INSERT INTO user_financial_data (user_id, expense_id, amount, description, category, type, timestamp)
SELECT user_id, expense_id, amount, description, category, 'expense', timestamp
FROM expenses
WHERE user_id = 1;

-- Update user_financial_summary
INSERT INTO user_financial_summary (user_id, current_balance, total_income, total_expenses, net_savings, last_income_date, last_expense_date)
SELECT 
    1 as user_id,
    (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = 1) - 
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = 1) as current_balance,
    (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = 1) as total_income,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = 1) as total_expenses,
    (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = 1) - 
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = 1) as net_savings,
    (SELECT MAX(timestamp) FROM incomes WHERE user_id = 1) as last_income_date,
    (SELECT MAX(timestamp) FROM expenses WHERE user_id = 1) as last_expense_date
ON DUPLICATE KEY UPDATE
    current_balance = VALUES(current_balance),
    total_income = VALUES(total_income),
    total_expenses = VALUES(total_expenses),
    net_savings = VALUES(net_savings),
    last_income_date = VALUES(last_income_date),
    last_expense_date = VALUES(last_expense_date);
