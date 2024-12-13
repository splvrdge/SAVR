const express = require("express");
const router = express.Router();
const financialController = require("../controllers/financialController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get(
  "/summary/:user_id",
  authenticateToken,
  financialController.getFinancialSummary
);

router.get(
  "/history/:user_id",
  authenticateToken,
  financialController.getFinancialHistory
);

module.exports = router;
