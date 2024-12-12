const db = require("../config/db");

// Update user profile
exports.updateProfile = async (req, res) => {
  const { name, email } = req.body;
  const currentUserMail = req.user_email;

  if (!name || !email) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  const query = `UPDATE user SET user_name = ?, user_email = ? WHERE user_email = ?`;
  try {
    const [results] = await db.execute(query, [name, email, currentUserMail]);

    if (results.changedRows === 1) {
      res.json({ success: true, message: "Profile updated successfully" });
    } else {
      if (results.affectedRows === 0) {
        res.status(404).json({ success: false, message: "User not found" });
      } else {
        res.status(400).json({
          success: false,
          message: "No changes made or multiple users updated",
        });
      }
    }
  } catch (err) {
    console.error("Error updating profile:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};

// Get secured user information
exports.getSecuredInfo = async (req, res) => {
  const query = `SELECT user_name FROM user WHERE user_email = ?`;
  try {
    const [results] = await db.execute(query, [req.user_email]);

    if (results.length === 1) {
      const user = results[0];
      res.json({
        success: true,
        message: "User authenticated",
        user_name: user.user_name,
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (err) {
    console.error("Error retrieving user information:", err);
    res
      .status(500)
      .json({ success: false, message: "Error retrieving user information" });
  }
};
