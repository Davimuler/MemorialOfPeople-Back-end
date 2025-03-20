const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');

// Получение настроек
router.get('/', siteSettingsController.getSettings);

// Обновление настроек
router.put('/', siteSettingsController.updateSettings);

module.exports = router;