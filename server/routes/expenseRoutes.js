const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { validateToken, validateUser } = require("../middlewares/authMiddleware");
const { validateExpense, handleValidationErrors } = require("../middlewares/validationMiddleware");
const { param } = require("express-validator");

router.post(
  "/add", 
  validateToken,
  validateExpense,
  handleValidationErrors,
  expenseController.addExpense
);

router.get(
  "/:user_id",
  validateToken,
  validateUser,
  expenseController.getExpenses
);

router.put(
  "/update/:expense_id",
  validateToken,
  validateExpense,
  handleValidationErrors,
  expenseController.updateExpense
);

router.delete(
  "/delete/:expense_id",
  validateToken,
  param('expense_id').isInt().withMessage('Invalid expense ID'),
  handleValidationErrors,
  expenseController.deleteExpense
);

router.get("/categories", (req, res) => {
  const categories = [
    "Food",
    "Transportation",
    "Housing",
    "Utilities",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Education",
    "Other"
  ];
  res.json({ success: true, data: categories });
});

module.exports = router;
