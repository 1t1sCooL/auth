const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const BlacklistedToken = require("../models/BlacklistedToken");
const { SALT_ROUNDS } = require("../config/constants");

class UserController {
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }
      res.json({ user });
    } catch (err) {
      console.error("Ошибка получения профиля:", err);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  }

  getDashboard(req, res) {
    res.json({
      message: `Добро пожаловать в панель управления, ${
        req.user.username || "пользователь"
      }!`,
      user: req.user,
    });
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: "Текущий пароль и новый пароль обязательны",
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Новый пароль не менее 6 символов" });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Неверный текущий пароль" });
      }

      user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await user.save();

      res.json({ message: "Пароль успешно изменён" });
    } catch (err) {
      console.error("Ошибка смены пароля:", err);
      res.status(500).json({ error: "Ошибка при смене пароля" });
    }
  }

  async deleteAccount(req, res) {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          error: "Для удаления аккаунта необходимо указать пароль",
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Неверный пароль" });
      }

      await RefreshToken.deleteMany({ userId: user._id });

      const authHeader = req.header("Authorization");
      const accessToken = (authHeader || "").replace("Bearer ", "");
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

      await User.deleteOne({ _id: user._id });

      res.json({ message: "Аккаунт успешно удалён" });
    } catch (err) {
      console.error("Ошибка удаления аккаунта:", err);
      res.status(500).json({ error: "Ошибка при удалении аккаунта" });
    }
  }
}

module.exports = new UserController();
