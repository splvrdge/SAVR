const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const goalRoutes = require("./routes/goalsRoutes");
const financialRoutes = require("./routes/financialRoutes");

const cron = require("node-cron");
const db = require("./config/db");

const app = express();
const SERVER_PORT = process.env.SERVER_PORT;

app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/goal", goalRoutes);
app.use("/api/financial", financialRoutes);

cron.schedule("0 0 * * *", async () => {
  try {
    const query = `DELETE FROM tokens WHERE expires_at <= NOW()`;
    await db.execute(query);
    console.log("Expired tokens cleaned up");
  } catch (err) {
    console.error("Error cleaning up tokens:", err);
  }
});

app.listen(SERVER_PORT, () => {
  console.log(`Server is running on port ${SERVER_PORT}`);
});
