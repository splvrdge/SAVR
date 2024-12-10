const express = require("express");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cron = require("node-cron");
const db = require("./config/db");

const app = express();
const SERVER_PORT = process.env.SERVER_PORT;

app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

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
