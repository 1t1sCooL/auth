const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("❌ JWT_SECRET должен быть задан в .env и иметь длину не менее 32 символов");
  process.exit(1);
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.EXP_IN || "24h",
  REFRESH_EXPIRES_IN: process.env.REFRESH_EXP_IN || "7d",
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS, 10) || 10,
  ROLES: {
    USER: "user",
    ADMIN: "admin",
  },
  PORT: parseInt(process.env.PORT, 10) || 3000,
};
