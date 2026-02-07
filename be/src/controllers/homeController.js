class HomeController {
  getApiInfo(req, res) {
    res.json({
      message: "API аутентификации работает!",
      endpoints: [
        "POST /api/auth/register - Регистрация",
        "POST /api/auth/login - Вход (возвращает accessToken и refreshToken)",
        "POST /api/auth/refresh - Обновление пары токенов (тело: { refreshToken })",
        "POST /api/auth/logout - Выход (тело: { refreshToken, accessToken } — оба для немедленной инвалидации)",
        "GET /api/users/dashboard - Защищенный маршрут (заголовок Authorization: Bearer <accessToken>)",
        "GET /api/users/profile - Профиль пользователя (требуется accessToken)",
      ],
    });
  }
}

module.exports = new HomeController();
