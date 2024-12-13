const express = require("express");
const router = express.Router();
const incomeController = require("../controllers/incomeController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { 
  incomeValidationRules, 
  handleValidationErrors,
  userIdValidation 
} = require("../middlewares/validationMiddleware");
const { param } = require("express-validator");

router.post(
  "/add", 
  authenticateToken, 
  incomeValidationRules,
  handleValidationErrors,
  incomeController.addIncome
);

router.get(
  "/:user_id",
  authenticateToken,
  userIdValidation,
  handleValidationErrors,
  incomeController.getIncomes
);

router.put(
  "/update",
  authenticateToken,
  incomeValidationRules,
  handleValidationErrors,
  incomeController.updateIncome
);

router.delete(
  "/delete/:income_id",
  authenticateToken,
  param('income_id').isInt().withMessage('Invalid income ID'),
  handleValidationErrors,
  incomeController.deleteIncome
);

router.get("/categories", (req, res) => {
  const categories = ["Business", "Investments", "Salary", "Other Income"];
  res.json({ success: true, data: categories });
});

module.exports = router;
