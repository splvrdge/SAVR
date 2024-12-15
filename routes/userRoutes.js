const express = require("express");
const userController = require("../controllers/userController");
const { validateToken } = require("../middlewares/authMiddleware");
const { body } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/validationMiddleware");

const router = express.Router();

// Profile update validation
const validateProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  body("currentPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Current password must be at least 6 characters"),
  body("newPassword")
    .optional()
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters")
    .custom((value, { req }) => {
      if (value && !req.body.currentPassword) {
        throw new Error("Current password is required to set new password");
      }
      return true;
    })
];

router.put(
  "/profile",
  validateToken,
  validateProfileUpdate,
  handleValidationErrors,
  userController.updateProfile
);

router.get(
  "/secured-info",
  validateToken,
  userController.getSecuredInfo
);

module.exports = router;
