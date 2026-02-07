const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");

router.get("/dashboard", authMiddleware, userController.getDashboard);
router.get("/profile", authMiddleware, userController.getProfile);
router.patch("/password", authMiddleware, userController.changePassword);
router.delete("/account", authMiddleware, userController.deleteAccount);

module.exports = router;
