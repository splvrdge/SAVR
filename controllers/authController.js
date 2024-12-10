const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const {
  secretKey,
  tokenExpiration,
  refreshTokenSecret,
  refreshTokenExpiration,
} = require("../config/auth");

function generateAccessToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      user_email: user.user_email,
      user_name: user.user_name,
    },
    secretKey,
    { expiresIn: tokenExpiration }
  );
}

function generateRefreshToken(user) {
  return jwt.sign({ user_id: user.user_id }, refreshTokenSecret, {
    expiresIn: refreshTokenExpiration,
  });
}

exports.login = async (req, res) => {
  const { user_email, user_password } = req.body;
  const query = `SELECT * FROM users WHERE user_email = ?`;

  try {
    const [results] = await db.execute(query, [user_email]);

    if (results.length === 1) {
      const user = results[0];
      const hashedPassword = user.user_password;
      const isPasswordMatch = await bcrypt.compare(
        user_password,
        hashedPassword
      );

      if (isPasswordMatch) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        const insertTokenQuery = `
          INSERT INTO tokens (user_id, refresh_token, expires_at)
          VALUES (?, ?, ?)
        `;
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await db.execute(insertTokenQuery, [
          user.user_id,
          refreshToken,
          expiresAt,
        ]);

        res.json({
          success: true,
          message: "Login successful",
          accessToken,
          refreshToken,
          user_name: user.user_name,
        });
      } else {
        res
          .status(401)
          .json({ success: false, message: "Invalid email or password" });
      }
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.signup = async (req, res) => {
  const { user_name, user_email, user_password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(user_password, 10);
    const query = `INSERT INTO users (user_name, user_email, user_password) VALUES (?, ?, ?)`;
    const [results] = await db.execute(query, [
      user_name,
      user_email,
      hashedPassword,
    ]);

    const user = {
      user_id: results.insertId,
      user_name,
      user_email,
    };

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const insertTokenQuery = `
      INSERT INTO tokens (user_id, refresh_token, expires_at)
      VALUES (?, ?, ?)
    `;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.execute(insertTokenQuery, [user.user_id, refreshToken, expiresAt]);

    res.json({
      success: true,
      message: "Signup successful",
      accessToken,
      refreshToken,
      user_name,
    });
  } catch (err) {
    console.error("Error signing up:", err);
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(403)
      .json({ success: false, message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, refreshTokenSecret);
    const query = `SELECT * FROM tokens WHERE refresh_token = ?`;

    const [results] = await db.execute(query, [refreshToken]);

    if (results.length === 0) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });
    }

    const userQuery = `SELECT * FROM users WHERE user_id = ?`;
    const [userResults] = await db.execute(userQuery, [decoded.user_id]);

    if (userResults.length === 1) {
      const user = userResults[0];
      const newAccessToken = generateAccessToken(user);

      res.json({
        success: true,
        message: "Access token refreshed",
        accessToken: newAccessToken,
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error refreshing token:", err);
    res
      .status(403)
      .json({ success: false, message: "Invalid or expired refresh token" });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const deleteTokenQuery = `DELETE FROM tokens WHERE refresh_token = ?`;
    await db.execute(deleteTokenQuery, [refreshToken]);

    res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    console.error("Error logging out:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
