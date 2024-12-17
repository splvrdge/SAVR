const express = require("express");
const router = express.Router();
const incomeController = require("../controllers/incomeController");
const { validateToken, validateUser } = require("../middlewares/authMiddleware");
const { 
  validateIncome,
  handleValidationErrors 
} = require("../middlewares/validationMiddleware");
const { param } = require("express-validator");

router.post(
  "/add", 
  validateToken,
  validateIncome,
  handleValidationErrors,
  incomeController.addIncome
);

router.get(
  "/:user_id",
  validateToken,
  validateUser,
  incomeController.getIncomes
);

router.put(
  "/update/:income_id",
  validateToken,
  validateIncome,
  handleValidationErrors,
  incomeController.updateIncome
);

router.delete(
  "/delete/:income_id",
  validateToken,
  param('income_id').isInt().withMessage('Invalid income ID'),
  handleValidationErrors,
  incomeController.deleteIncome
);

router.get("/categories", (req, res) => {
  const categories = ["Business", "Investments", "Salary", "Other Income"];
  res.json({ success: true, data: categories });
});

module.exports = router;
