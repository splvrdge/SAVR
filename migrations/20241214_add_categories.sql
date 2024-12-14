-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    icon VARCHAR(50),
    color VARCHAR(7),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create unique index on name and type
CREATE UNIQUE INDEX categories_name_type_idx ON categories (name, type);

-- Insert default expense categories
INSERT IGNORE INTO categories (name, type, icon, color, description)
VALUES 
    ('Food', 'expense', 'restaurant', '#FF5733', 'Food and dining expenses'),
    ('Transportation', 'expense', 'directions_car', '#33FF57', 'Transportation and travel costs'),
    ('Housing', 'expense', 'home', '#3357FF', 'Rent, mortgage, and housing expenses'),
    ('Utilities', 'expense', 'power', '#FF33F6', 'Electricity, water, and utility bills'),
    ('Healthcare', 'expense', 'local_hospital', '#33FFF6', 'Medical and healthcare expenses'),
    ('Entertainment', 'expense', 'movie', '#F6FF33', 'Entertainment and leisure activities'),
    ('Shopping', 'expense', 'shopping_cart', '#FF3333', 'General shopping expenses'),
    ('Education', 'expense', 'school', '#33FF33', 'Education and learning costs'),
    ('Personal Care', 'expense', 'spa', '#3333FF', 'Personal care and grooming'),
    ('Other', 'expense', 'more_horiz', '#808080', 'Other miscellaneous expenses');

-- Insert default income categories
INSERT IGNORE INTO categories (name, type, icon, color, description)
VALUES 
    ('Salary', 'income', 'work', '#4CAF50', 'Regular employment income'),
    ('Freelance', 'income', 'computer', '#2196F3', 'Freelance and contract work'),
    ('Investments', 'income', 'trending_up', '#FFC107', 'Investment returns and dividends'),
    ('Gifts', 'income', 'card_giftcard', '#E91E63', 'Gifts and monetary presents'),
    ('Rental', 'income', 'home', '#9C27B0', 'Rental property income'),
    ('Business', 'income', 'business', '#FF9800', 'Business and entrepreneurial income'),
    ('Other', 'income', 'more_horiz', '#808080', 'Other miscellaneous income');

-- Add category_id to expenses table
ALTER TABLE expenses ADD COLUMN category_id INT;
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_category FOREIGN KEY (category_id) REFERENCES categories(id);

-- Add category_id to incomes table
ALTER TABLE incomes ADD COLUMN category_id INT;
ALTER TABLE incomes ADD CONSTRAINT fk_incomes_category FOREIGN KEY (category_id) REFERENCES categories(id);
