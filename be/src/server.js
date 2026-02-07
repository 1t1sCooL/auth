require("dotenv").config();

const app = require("./app");
const { connectDB, disconnectDB } = require("./config/database");
const { PORT } = require("./config/constants");

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    });

    const shutdown = async () => {
      console.log("🛑 Остановка сервера...");
      server.close(async () => {
        await disconnectDB();
        console.log("👋 Сервер остановлен");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Не удалось запустить сервер:", error);
    process.exit(1);
  }
};

startServer();
