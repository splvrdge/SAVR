const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { validateToken, validateUser } = require('../middlewares/authMiddleware');
const { param } = require('express-validator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

// User ID validation middleware
const validateUserId = [
  param('user_id').isInt().withMessage('Invalid user ID'),
  handleValidationErrors
];

// Analytics routes
router.get(
  '/expenses/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getExpensesByCategory
);

router.get(
  '/income/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getIncomeByCategory
);

router.get(
  '/trends/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getMonthlyTrends
);

router.get(
  '/expenses-by-date/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getExpensesByDate
);

router.get(
  '/income-by-date/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getIncomeByDate
);

router.get(
  '/budget/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getBudget
);

router.get(
  '/savings/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getSavings
);

router.get(
  '/expenses-by-tag/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getExpensesByTag
);

router.get(
  '/income-by-tag/:user_id', 
  validateToken,
  validateUserId,
  analyticsController.getIncomeByTag
);

module.exports = router;
