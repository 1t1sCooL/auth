const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const homeController = require("./controllers/homeController");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error:
      "Слишком много запросов с вашего IP, повторите попытку через 15 минут",
  },
});

app.use(limiter);

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.use((err, req, res, next) => {
  if (err.status === 400 && err.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({
        error:
          "Неверный формат JSON в теле запроса. Ключи и значения должны быть в двойных кавычках.",
      });
  }
  console.error("Ошибка сервера:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

module.exports = app;
