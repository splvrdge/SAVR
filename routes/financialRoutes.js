const express = require("express");
const router = express.Router();
const financialController = require("../controllers/financialController");
const { validateToken, validateUser } = require("../middlewares/authMiddleware");
const { param } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/validationMiddleware");

// Validation middleware
const validateUserId = [
  param("user_id")
    .isInt({ min: 1 })
    .withMessage("Invalid user ID"),
  handleValidationErrors
];

router.get(
  "/summary/:user_id",
  validateToken,
  validateUserId,
  validateUser,
  financialController.getFinancialSummary
);

router.get(
  "/history/:user_id",
  validateToken,
  validateUserId,
  validateUser,
  financialController.getTransactionHistory
);

router.get(
  "/transaction/:transaction_id",
  validateToken,
  param("transaction_id")
    .isInt({ min: 1 })
    .withMessage("Invalid transaction ID"),
  handleValidationErrors,
  financialController.getTransactionDetails
);

module.exports = router;
