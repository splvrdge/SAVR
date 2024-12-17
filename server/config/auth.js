const crypto = require("crypto");

const secretKey =
  process.env.SECRET_KEY;
const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET;

const tokenExpiration = "1d";
const refreshTokenExpiration = "7d";

module.exports = {
  secretKey,
  refreshTokenSecret,
  tokenExpiration,
  refreshTokenExpiration,
};
