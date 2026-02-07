const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");
const BlacklistedToken = require("../models/BlacklistedToken");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res
        .status(401)
        .json({ error: "Доступ запрещен. Токен отсутствует" });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Неверный формат токена" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const blacklisted = await BlacklistedToken.findOne({ jti: decoded.jti });
    if (blacklisted) {
      return res.status(401).json({ error: "Токен недействителен (выход выполнен)" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Ошибка проверки токена:", err.message);

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Неверный токен" });
    }

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Токен истек" });
    }

    return res.status(401).json({ error: "Ошибка авторизации" });
  }
};

module.exports = authMiddleware;
