class HomeController {
  getApiInfo(req, res) {
    res.json({
      message: "API аутентификации работает!",
      endpoints: [
        "POST /api/auth/register - Регистрация",
        "POST /api/auth/login - Вход",
        "GET /api/users/dashboard - Защищенный маршрут (требуется токен)",
        "GET /api/users/profile - Профиль пользователя (требуется токен)",
      ],
    });
  }
}

module.exports = new HomeController();
