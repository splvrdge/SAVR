const winston = require('winston');
const { format } = winston;
const path = require('path');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({
      format: 'HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'savr-api' },
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} ${level}: ${message} ${metaStr}`.trim();
        })
      )
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({ 
    filename: path.join('logs', 'error.log'), 
    level: 'error',
    format: format.combine(
      format.timestamp(),
      format.json()
    )
  }));
}

// Export a function that safely logs objects
const safeLog = (level, message, object = null) => {
  if (object) {
    // Remove sensitive fields
    const safeObject = { ...object };
    const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'key'];
    
    sensitiveFields.forEach(field => {
      if (safeObject[field]) {
        safeObject[field] = '[REDACTED]';
      }
    });
    
    logger[level](`${message} ${JSON.stringify(safeObject)}`);
  } else {
    logger[level](message);
  }
};

module.exports = {
  error: (message, object = null) => safeLog('error', message, object),
  warn: (message, object = null) => safeLog('warn', message, object),
  info: (message, object = null) => safeLog('info', message, object),
  http: (message, object = null) => safeLog('http', message, object),
  debug: (message, object = null) => safeLog('debug', message, object),
};
