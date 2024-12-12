const jwt = require("jsonwebtoken");
const { secretKey } = require("../config/auth");

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(403)
      .json({ success: false, message: "Token is not provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ success: false, message: "Malformed token" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      let message = "Unauthorized access";
      if (err.name === "TokenExpiredError") {
        message = "Token has expired";
      } else if (err.name === "JsonWebTokenError") {
        message = "Invalid token";
      }
      return res.status(401).json({ success: false, message });
    }

    req.user_email = decoded.user_email;
    next();
  });
};
