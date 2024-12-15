-- Drop and recreate goals table
DROP TABLE IF EXISTS goal_contributions;
DROP TABLE IF EXISTS goals;

-- Create goals table
CREATE TABLE goals (
    goal_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) DEFAULT 0.00,
    target_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create goal contributions table
CREATE TABLE goal_contributions (
    contribution_id INT PRIMARY KEY AUTO_INCREMENT,
    goal_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    contribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(goal_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_goal_date (goal_id, contribution_date),
    INDEX idx_user_contributions (user_id, contribution_date)
);

-- Create trigger for goal progress tracking on insert
CREATE TRIGGER after_contribution_insert
AFTER INSERT ON goal_contributions
FOR EACH ROW
UPDATE goals 
SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM goal_contributions
    WHERE goal_id = NEW.goal_id
),
updated_at = CURRENT_TIMESTAMP
WHERE goal_id = NEW.goal_id;

-- Create trigger for goal progress tracking on delete
CREATE TRIGGER after_contribution_delete
AFTER DELETE ON goal_contributions
FOR EACH ROW
UPDATE goals 
SET current_amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM goal_contributions
    WHERE goal_id = OLD.goal_id
),
updated_at = CURRENT_TIMESTAMP
WHERE goal_id = OLD.goal_id;
