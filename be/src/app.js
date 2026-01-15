const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const homeController = require("./controllers/homeController");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", routes);

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

app.use((err, req, res, next) => {
  console.error("Ошибка сервера:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

module.exports = app;
