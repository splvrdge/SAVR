const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
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
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters');

// Income validation rules
const incomeValidationRules = [
  body('user_id').isInt().withMessage('User ID must be an integer'),
  amountValidation(),
  categoryValidation(),
  descriptionValidation(),
  body('income_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

// Expense validation rules
const expenseValidationRules = [
  body('user_id').isInt().withMessage('User ID must be an integer'),
  amountValidation(),
  categoryValidation(),
  descriptionValidation(),
  body('expense_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

// Goal validation rules
const goalValidationRules = [
  body('user_id').isInt().withMessage('User ID must be an integer'),
  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  amountValidation('target_amount'),
  body('current_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Current amount must be a positive number')
    .custom((value, { req }) => {
      if (value > req.body.target_amount) {
        throw new Error('Current amount cannot exceed target amount');
      }
      return true;
    }),
  body('target_date')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      const targetDate = new Date(value);
      const today = new Date();
      if (targetDate < today) {
        throw new Error('Target date must be in the future');
      }
      return true;
    })
];

// Goal contribution validation rules
const contributionValidationRules = [
  body('user_id').isInt().withMessage('User ID must be an integer'),
  body('goal_id').isInt().withMessage('Goal ID must be an integer'),
  amountValidation(),
  descriptionValidation('notes'),
  body('contribution_date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
];

// User ID param validation
const userIdValidation = [
  param('user_id')
    .isInt()
    .withMessage('Invalid user ID')
];

// Goal ID param validation
const goalIdValidation = [
  param('goal_id')
    .isInt()
    .withMessage('Invalid goal ID')
];

module.exports = {
  handleValidationErrors,
  incomeValidationRules,
  expenseValidationRules,
  goalValidationRules,
  contributionValidationRules,
  userIdValidation,
  goalIdValidation
};
