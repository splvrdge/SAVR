const crypto = require("crypto");

const secretKey =
  process.env.SECRET_KEY || crypto.randomBytes(32).toString("hex");
const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(32).toString("hex");

const tokenExpiration = "15m";
const refreshTokenExpiration = "7d";

module.exports = {
  secretKey,
  refreshTokenSecret,
  tokenExpiration,
  refreshTokenExpiration,
};
