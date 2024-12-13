const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/add", authenticateToken, expenseController.addExpense);
router.get(
  "/:user_id",
  authenticateToken,
  expenseController.getExpenses
);
router.put(
  "/update",
  authenticateToken,
  expenseController.updateExpense
);
router.delete(
  "/delete/:expense_id",
  authenticateToken,
  expenseController.deleteExpense
);

module.exports = router;
