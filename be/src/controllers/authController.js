const crypto = require("crypto");
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
const { sendVerificationEmail } = require("../services/mailerService");

const REFRESH_DAYS = 7;

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({
          error: "Имя пользователя, email и пароль обязательны",
        });
      }
      const trimmedUsername = username.trim();
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedUsername.length < 3) {
        return res
          .status(400)
          .json({ error: "Имя пользователя не менее 3 символов" });
      }
      if (!User.isValidEmail(trimmedEmail)) {
        return res.status(400).json({ error: "Некорректный формат email" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Пароль не менее 6 символов" });
      }

      const existingUser = await User.findOne({
        $or: [{ username: trimmedUsername }, { email: trimmedEmail }],
      });
      if (existingUser) {
        if (existingUser.username === trimmedUsername) {
          return res.status(400).json({ error: "Пользователь с таким именем уже существует" });
        }
        return res.status(400).json({ error: "Пользователь с таким email уже существует" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const emailVerificationToken = crypto.randomBytes(32).toString("hex");
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user = new User({
        username: trimmedUsername,
        email: trimmedEmail,
        password: hashedPassword,
        emailVerificationToken,
        emailVerificationExpires,
      });

      await user.save();

      try {
        await sendVerificationEmail(trimmedEmail, trimmedUsername, emailVerificationToken);
      } catch (mailErr) {
        const status = mailErr.response?.status;
        const msg = mailErr.response?.data?.error || mailErr.response?.data?.details || mailErr.message;
        const code = mailErr.code;
        console.error("Ошибка отправки письма:", {
          message: mailErr.message,
          code,
          status,
          mailerResponse: mailErr.response?.data,
        });
        await User.findByIdAndDelete(user._id);
        const userMessage =
          process.env.NODE_ENV === "development" && msg
            ? `Mailer: ${msg} (${code || status || ""})`
            : "Не удалось отправить письмо подтверждения. Попробуйте позже.";
        return res.status(503).json({ error: userMessage });
      }

      res.status(201).json({
        message:
          "Регистрация начата. Подтвердите email по ссылке из письма, затем войдите в аккаунт.",
        userId: user._id,
      });
    } catch (err) {
      console.error("Ошибка регистрации:", err);
      res.status(500).json({ error: "Ошибка при регистрации" });
    }
  }

  async verifyEmail(req, res) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error: "Токен подтверждения не указан" });
      }

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      });
      if (!user) {
        return res
          .status(400)
          .json({ error: "Ссылка недействительна или истекла. Зарегистрируйтесь снова." });
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.status(200).json({
        message: "Email успешно подтверждён. Теперь вы можете войти в аккаунт.",
      });
    } catch (err) {
      console.error("Ошибка подтверждения email:", err);
      res.status(500).json({ error: "Ошибка при подтверждении email" });
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

      if (!user.emailVerified) {
        return res.status(403).json({
          error: "Подтвердите email по ссылке из письма, затем войдите снова.",
        });
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
