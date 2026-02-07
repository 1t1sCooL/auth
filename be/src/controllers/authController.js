const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const BlacklistedToken = require("../models/BlacklistedToken");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { SALT_ROUNDS } = require("../config/constants");

const REFRESH_DAYS = 7;

class AuthController {
  async register(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Имя пользователя и пароль обязательны" });
      }
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        return res
          .status(400)
          .json({ error: "Имя пользователя не менее 3 символов" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Пароль не менее 6 символов" });
      }

      const existingUser = await User.findOne({ username: trimmedUsername });
      if (existingUser) {
        return res.status(400).json({ error: "Пользователь уже существует" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = new User({
        username: trimmedUsername,
        password: hashedPassword,
      });

      await user.save();

      res.status(201).json({
        message: "Пользователь успешно зарегистрирован",
        userId: user._id,
      });
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      res.status(500).json({ error: "Ошибка при регистрации" });
    }
  }

  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Имя пользователя и пароль обязательны" });
      }

      const user = await User.findOne({ username: username.trim() });
      if (!user) {
        return res.status(401).json({ error: "Неверные учетные данные" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Неверные учетные данные" });
      }

      const accessToken = generateAccessToken({
        id: user._id,
        username: user.username,
        role: user.role,
      });

      const { token: refreshToken, tokenId } = generateRefreshToken(user._id);
      const expiresAt = new Date(
        Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000,
      );
      await RefreshToken.create({ tokenId, userId: user._id, expiresAt });

      res.json({
        message: "Вход выполнен успешно",
        accessToken,
        refreshToken,
        expiresIn: REFRESH_DAYS * 24 * 60 * 60,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error("Ошибка входа:", err);
      res.status(500).json({ error: "Ошибка при входе" });
    }
  }

  async refresh(req, res) {
    try {
      const { refreshToken: token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Refresh-токен обязателен" });
      }

      const decoded = verifyRefreshToken(token);
      const { sub: userId, tokenId } = decoded;

      const stored = await RefreshToken.findOne({ tokenId, userId });
      if (!stored) {
        return res
          .status(401)
          .json({ error: "Недействительный или использованный refresh-токен" });
      }

      const user = await User.findById(userId);
      if (!user) {
        await RefreshToken.deleteOne({ tokenId });
        return res.status(401).json({ error: "Пользователь не найден" });
      }

      await RefreshToken.deleteOne({ tokenId });

      const accessToken = generateAccessToken({
        id: user._id,
        username: user.username,
        role: user.role,
      });
      const { token: newRefreshToken, tokenId: newTokenId } =
        generateRefreshToken(user._id);
      const expiresAt = new Date(
        Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000,
      );
      await RefreshToken.create({
        tokenId: newTokenId,
        userId: user._id,
        expiresAt,
      });

      res.json({
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: REFRESH_DAYS * 24 * 60 * 60,
      });
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Refresh-токен истёк" });
      }
      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Неверный refresh-токен" });
      }
      console.error("Ошибка обновления токена:", err);
      res.status(500).json({ error: "Ошибка при обновлении токена" });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken: token, accessToken: accessTokenBody } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Refresh-токен обязателен" });
      }

      let decoded;
      try {
        decoded = verifyRefreshToken(token);
      } catch {
        return res.json({ message: "Выход выполнен" });
      }

      await RefreshToken.deleteOne({ tokenId: decoded.tokenId });

      const accessToken =
        accessTokenBody ||
        (req.header("Authorization") || "").replace("Bearer ", "");
      if (accessToken) {
        try {
          const payload = jwt.decode(accessToken);
          if (payload?.jti && payload.exp && payload.exp * 1000 > Date.now()) {
            await BlacklistedToken.create({
              jti: payload.jti,
              expiresAt: new Date(payload.exp * 1000),
            });
          }
        } catch {}
      }

      res.json({ message: "Выход выполнен" });
    } catch (err) {
      console.error("Ошибка выхода:", err);
      res.status(500).json({ error: "Ошибка при выходе" });
    }
  }
}

module.exports = new AuthController();
