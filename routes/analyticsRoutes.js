const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Analytics routes
router.get('/expenses/:user_id', authenticateToken, analyticsController.getExpensesByCategory);
router.get('/income/:user_id', authenticateToken, analyticsController.getIncomeByCategory);
router.get('/trends/:user_id', authenticateToken, analyticsController.getMonthlyTrends);
router.get('/expenses-by-date/:user_id', authenticateToken, analyticsController.getExpensesByDate);
router.get('/income-by-date/:user_id', authenticateToken, analyticsController.getIncomeByDate);
router.get('/budget/:user_id', authenticateToken, analyticsController.getBudget);
router.get('/savings/:user_id', authenticateToken, analyticsController.getSavings);
router.get('/expenses-by-tag/:user_id', authenticateToken, analyticsController.getExpensesByTag);
router.get('/income-by-tag/:user_id', authenticateToken, analyticsController.getIncomeByTag);

module.exports = router;
