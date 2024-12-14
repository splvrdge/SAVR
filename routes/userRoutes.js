const express = require("express");
const userController = require("../controllers/userController");
const { validateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.put(
  "/profile",
  validateToken,
  userController.updateProfile
);

router.get(
  "/secured-info",
  validateToken,
  userController.getSecuredInfo
);

module.exports = router;
