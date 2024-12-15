-- Add is_completed column to goals table
ALTER TABLE goals
ADD COLUMN is_completed BOOLEAN DEFAULT FALSE AFTER current_amount;

-- Update existing goals based on current_amount vs target_amount
UPDATE goals g
SET g.is_completed = (g.current_amount >= g.target_amount)
WHERE g.goal_id > 0;
