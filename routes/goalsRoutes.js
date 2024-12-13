const express = require("express");
const router = express.Router();
const goalController = require("../controllers/goalsController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/add", authenticateToken, goalController.addGoal);
router.get("/:user_id", authenticateToken, goalController.getGoals);
router.put("/update/:goal_id", authenticateToken, goalController.updateGoal);
router.delete("/delete/:goal_id", authenticateToken, goalController.deleteGoal);

router.post("/contribution/add", authenticateToken, goalController.addContribution);
router.get("/contributions/:goal_id", authenticateToken, goalController.getContributions);
router.delete("/contribution/:contribution_id", authenticateToken, goalController.deleteContribution);

module.exports = router;
