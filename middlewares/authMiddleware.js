const jwt = require('jsonwebtoken');
const db = require('../config/db');
const logger = require('../utils/logger');

const validateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn(`Authentication failed: No token provided`, {
        requestId: req.requestId,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn(`Authentication failed: Invalid token format`, {
        requestId: req.requestId,
        path: req.path
      });
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token exists in database and is not expired
      const [tokens] = await db.execute(
        'SELECT * FROM tokens WHERE token = ? AND expires_at > NOW() AND is_revoked = 0',
        [token]
      );

      if (tokens.length === 0) {
        logger.warn(`Authentication failed: Token not found or expired`, {
          requestId: req.requestId,
          userId: decoded.id,
          path: req.path
        });
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token expired or invalid.'
        });
      }

      // Check if user exists and is active
      const [users] = await db.execute(
        'SELECT id, email, is_active FROM users WHERE id = ?',
        [decoded.id]
      );

      if (users.length === 0 || !users[0].is_active) {
        logger.warn(`Authentication failed: User not found or inactive`, {
          requestId: req.requestId,
          userId: decoded.id,
          path: req.path
        });
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not found or inactive.'
        });
      }

      req.user = users[0];
      logger.debug(`Authentication successful`, {
        requestId: req.requestId,
        userId: users[0].id,
        email: users[0].email,
        path: req.path
      });
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.warn(`Authentication failed: Token expired`, {
          requestId: req.requestId,
          path: req.path
        });
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token expired.'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        logger.warn(`Authentication failed: Invalid token`, {
          requestId: req.requestId,
          path: req.path
        });
        return res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token.'
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`, {
      requestId: req.requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      path: req.path
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

const validateUser = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    
    if (!user_id) {
      logger.warn(`User validation failed: No user ID provided`, {
        requestId: req.requestId,
        path: req.path
      });
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (req.user.id !== parseInt(user_id)) {
      logger.warn(`User validation failed: Unauthorized access attempt`, {
        requestId: req.requestId,
        requestedUserId: user_id,
        authenticatedUserId: req.user.id,
        path: req.path
      });
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own data.'
      });
    }

    logger.debug(`User validation successful`, {
      requestId: req.requestId,
      userId: user_id,
      path: req.path
    });
    next();
  } catch (error) {
    logger.error(`User validation error: ${error.message}`, {
      requestId: req.requestId,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      path: req.path
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error during user validation.'
    });
  }
};

module.exports = {
  validateToken,
  validateUser
};
