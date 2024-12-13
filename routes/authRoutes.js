const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/check-email", authController.checkEmail);
router.post("/refresh-token", authController.refreshToken);

module.exports = router;
