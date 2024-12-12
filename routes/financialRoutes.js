const express = require("express");
const router = express.Router();
const financialController = require("../controllers/financialController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get(
  "/summary/:user_id",
  verifyToken,
  financialController.getFinancialSummary
);

router.get(
  "/history/:user_id",
  verifyToken,
  financialController.getFinancialHistory
);

module.exports = router;
