const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/add", authMiddleware.verifyToken, expenseController.addExpense);
router.get(
  "/:user_id",
  authMiddleware.verifyToken,
  expenseController.getExpenses
);
router.put(
  "/update",
  authMiddleware.verifyToken,
  expenseController.updateExpense
);
router.delete(
  "/delete/:expense_id",
  authMiddleware.verifyToken,
  expenseController.deleteExpense
);

module.exports = router;
