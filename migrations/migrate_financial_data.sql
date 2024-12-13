-- Migrate income data
INSERT INTO incomes (user_id, amount, description, category, timestamp)
SELECT user_id, amount, description, category, timestamp
FROM user_financial_data
WHERE type = 'income';

-- Update user_financial_data with income_id references
UPDATE user_financial_data ufd
JOIN incomes i ON 
    ufd.user_id = i.user_id AND 
    ufd.amount = i.amount AND 
    ufd.timestamp = i.timestamp AND
    ufd.type = 'income'
SET ufd.income_id = i.income_id;

-- Migrate expense data
INSERT INTO expenses (user_id, amount, description, category, timestamp)
SELECT user_id, amount, description, category, timestamp
FROM user_financial_data
WHERE type = 'expense';

-- Update user_financial_data with expense_id references
UPDATE user_financial_data ufd
JOIN expenses e ON 
    ufd.user_id = e.user_id AND 
    ufd.amount = e.amount AND 
    ufd.timestamp = e.timestamp AND
    ufd.type = 'expense'
SET ufd.expense_id = e.expense_id;
