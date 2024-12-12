const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goalsController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/add", authMiddleware.verifyToken, goalController.addGoal);
router.get("/:user_id", authMiddleware.verifyToken, goalController.getGoals);
router.put("/update", authMiddleware.verifyToken, goalController.updateGoal);
router.delete(
  "/delete/:goal_id",
  authMiddleware.verifyToken,
  goalController.deleteGoal
);

module.exports = router;
