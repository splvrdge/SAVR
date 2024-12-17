const { body, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      errors: errors.array(),
      data: req.body
    });
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  logger.debug('Validation passed:', {
    data: req.body
  });
  next();
};

// Common validation rules
const amountValidation = (fieldName = 'amount') => 
  body(fieldName)
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0')
    .custom((value) => {
      if (value > 999999999.99) {
        throw new Error('Amount exceeds maximum allowed value');
      }
      return true;
    });

const categoryValidation = (fieldName = 'category') =>
  body(fieldName)
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters');

const descriptionValidation = (fieldName = 'description') =>
  body(fieldName)
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters');

// Income validation
const validateIncome = [
  amountValidation(),
  categoryValidation(),
  descriptionValidation(),
  body('type')
    .optional()
    .isIn(['one-time', 'recurring'])
    .withMessage('Type must be either one-time or recurring')
];

// Expense validation
const validateExpense = [
  amountValidation(),
  categoryValidation(),
  descriptionValidation(),
  body('type')
    .optional()
    .isIn(['one-time', 'recurring'])
    .withMessage('Type must be either one-time or recurring')
];

// Category validation
const validateCategory = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
];

// Registration validation
const validateRegistration = [
  body('user_email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('user_password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('user_name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

// Login validation
const validateLogin = [
  body('user_email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('user_password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  handleValidationErrors,
  validateIncome,
  validateExpense,
  validateCategory,
  validateRegistration,
  validateLogin
};
