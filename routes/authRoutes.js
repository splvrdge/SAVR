const express = require("express");
const authController = require("../controllers/authController");
const { validateLogin, validateRegistration, handleValidationErrors } = require("../middlewares/validationMiddleware");
const { body } = require("express-validator");

const router = express.Router();

router.post(
  "/login", 
  validateLogin,
  handleValidationErrors,
  authController.login
);

router.post(
  "/signup", 
  validateRegistration,
  handleValidationErrors,
  authController.signup
);

router.post(
  "/check-email",
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address"),
  handleValidationErrors,
  authController.checkEmail
);

router.post(
  "/refresh-token",
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required"),
  handleValidationErrors,
  authController.refreshToken
);

module.exports = router;
