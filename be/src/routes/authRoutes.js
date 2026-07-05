const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const authController = require("../controllers/authController");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Слишком много попыток входа с вашего IP, попробуйте через 15 минут" },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Слишком много запросов обновления токена, попробуйте позже" },
});

const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Слишком много попыток подтверждения, попробуйте позже" },
});

// Отдельный, более строгий лимит на сброс пароля — защита от рассылки писем и перебора токенов.
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Слишком много запросов сброса пароля, попробуйте через 15 минут" },
});

router.post("/register", authLimiter, authController.register);
router.get("/verify-email", verifyEmailLimiter, authController.verifyEmail);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", refreshLimiter, authController.refresh);
router.post("/logout", refreshLimiter, authController.logout);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);

module.exports = router;
