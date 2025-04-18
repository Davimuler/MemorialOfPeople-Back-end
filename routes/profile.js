const express = require("express");
const router = express.Router();
const profileController = require("../controllers/ProfileController");
const authMiddleware = require("../middleware/authMiddleware");

// Создание профиля
 router.post("/", profileController.createProfile);
//
// // Получение всех профилей
// router.get("/", profileController.getAllProfiles);
//
// // Получение профиля по ID
// router.get("/:id", profileController.getProfileById);
//
// // Обновление профиля
// router.put("/:id", authMiddleware, profileController.updateProfile);
//
// // Удаление профиля
// router.delete("/:id", authMiddleware, profileController.deleteProfile);

module.exports = router;