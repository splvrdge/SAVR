const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that we want to link the colors
winston.addColors(colors);

// Custom format for logging
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console(),
  
  // Error log file transport
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
  }),
  
  // All logs file transport
  new winston.transports.File({ filename: path.join('logs', 'all.log') }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});

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
