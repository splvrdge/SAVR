-- Drop the existing tokens table
DROP TABLE IF EXISTS tokens;

-- Re-create tokens table without is_revoked
CREATE TABLE tokens (
    token_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    refresh_token VARCHAR(512) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_tokens (user_id),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_token_expiry (expires_at)
);
