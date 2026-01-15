module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "fallback_secret_key",
  JWT_EXPIRES_IN: process.env.EXP_IN || "24h",
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS) || 10,
  ROLES: {
    USER: "user",
    ADMIN: "admin",
  },
};
