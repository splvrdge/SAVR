const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error with context
  logger.error(`${req.method} ${req.path} - ${err.message}`, {
    requestId: req.requestId,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userId: req.user?.id,
    statusCode: err.statusCode || 500
  });

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Handle authentication errors
  if (err.name === 'UnauthorizedError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: err.message
    });
  }

  // Handle forbidden access
  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: err.message
    });
  }

  // Handle not found errors
  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: 'Resource not found',
      error: err.message
    });
  }

  // Handle database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry found',
      error: 'A record with this information already exists'
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

// Handle 404 errors
const notFoundHandler = (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userId: req.user?.id
  });

  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
