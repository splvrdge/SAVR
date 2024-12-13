const express = require("express");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.put(
  "/profile",
  authenticateToken,
  userController.updateProfile
);

router.get(
  "/secured-info",
  authenticateToken,
  userController.getSecuredInfo
);

module.exports = router;
