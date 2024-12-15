const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goalsController");
const { validateToken, validateUser } = require("../middlewares/authMiddleware");
const { body, param } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/validationMiddleware");

// Validation middleware
const validateGoal = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Title must be between 2 and 100 characters"),
  body("target_amount")
    .isFloat({ min: 0.01 })
    .withMessage("Target amount must be greater than 0"),
  body("target_date")
    .isISO8601()
    .withMessage("Invalid target date")
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error("Target date must be in the future");
      }
      return true;
    }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  handleValidationErrors
];

const validateContribution = [
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Contribution amount must be greater than 0"),
  body("goal_id")
    .isInt({ min: 1 })
    .withMessage("Invalid goal ID"),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Notes must not exceed 255 characters"),
  handleValidationErrors
];

const validateGoalId = [
  param("goal_id")
    .isInt({ min: 1 })
    .withMessage("Invalid goal ID"),
  handleValidationErrors
];

// Create goal
router.post(
  "/create",
  validateToken,
  validateGoal,
  goalController.createGoal
);

// Get goals
router.get(
  "/",
  validateToken,
  goalController.getGoals
);

// Add contribution
router.post(
  "/contribute",
  validateToken,
  validateContribution,
  goalController.addContribution
);

// Update goal
router.put(
  "/update/:goal_id",
  validateToken,
  validateGoal,
  goalController.updateGoal
);

// Delete goal
router.delete(
  "/delete/:goal_id",
  validateToken,
  validateGoalId,
  goalController.deleteGoal
);

module.exports = router;