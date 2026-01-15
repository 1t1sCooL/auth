const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/authDemo");
    console.log("✅ Подключение к MongoDB установлено");
  } catch (err) {
    console.error("❌ Ошибка подключения к MongoDB:", err.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log("📴 MongoDB отключена");
};

module.exports = { connectDB, disconnectDB };
