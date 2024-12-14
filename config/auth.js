const crypto = require("crypto");

const secretKey =
  process.env.SECRET_KEY || "savr_development_secret_key";
const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || "savr_development_refresh_secret_key";

const tokenExpiration = "15m";
const refreshTokenExpiration = "7d";

module.exports = {
  secretKey,
  refreshTokenSecret,
  tokenExpiration,
  refreshTokenExpiration,
};
