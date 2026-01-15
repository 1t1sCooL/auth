const User = require("../models/User");

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
}

module.exports = new UserController();
