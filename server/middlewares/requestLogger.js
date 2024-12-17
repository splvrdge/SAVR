const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  // Generate request ID
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  // Log request details
  logger.info(`${req.method} ${req.path}`, {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userId: req.user?.id,
    userAgent: req.headers['user-agent']
  });

  // Log request body in development (excluding sensitive data)
  if (process.env.NODE_ENV === 'development' && req.body) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
    
    logger.debug('Request payload:', {
      requestId: req.requestId,
      body: sanitizedBody
    });
  }

  // Capture response
  const originalJson = res.json;
  res.json = function(body) {
    const responseTime = Date.now() - startTime;

    // Log response
    logger.info(`${req.method} ${req.path} ${res.statusCode}`, {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id
    });

    // Log response body in development (excluding sensitive data)
    if (process.env.NODE_ENV === 'development' && body) {
      const sanitizedBody = { ...body };
      if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
      if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
      
      logger.debug('Response payload:', {
        requestId: req.requestId,
        body: sanitizedBody
      });
    }

    return originalJson.call(this, body);
  };

  next();
};

module.exports = requestLogger;
