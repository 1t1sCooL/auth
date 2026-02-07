const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_EXPIRES_IN } = require("../config/constants");

const generateAccessToken = (payload) => {
  const withJti = { ...payload, jti: crypto.randomUUID() };
  return jwt.sign(withJti, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshToken = (userId) => {
  const tokenId = crypto.randomUUID();
  const token = jwt.sign(
    { sub: userId.toString(), tokenId },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
  return { token, tokenId };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
