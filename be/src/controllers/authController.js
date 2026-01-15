const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { generateToken } = require("../utils/jwt");
const { SALT_ROUNDS } = require("../config/constants");

class AuthController {
  async register(req, res) {
    try {
      const { username, password, role } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Имя пользователя и пароль обязательны" });
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: "Пользователь уже существует" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const user = new User({
        username,
        password: hashedPassword,
        role,
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

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: "Неверные учетные данные" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Неверные учетные данные" });
      }

      const token = generateToken({
        id: user._id,
        username: user.username,
        role: user.role,
      });

      res.json({
        message: "Вход выполнен успешно",
        token,
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
}

module.exports = new AuthController();
