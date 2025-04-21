const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');

// Get all settings
router.get('/', siteSettingsController.getSettings);

// Update settings
router.put('/', siteSettingsController.updateSettings);

// Get price for a specific country
router.get('/prices/:countryCode', siteSettingsController.getPrice);

// Update price for a specific country
router.put('/prices/:countryCode', siteSettingsController.updatePrice);

module.exports = router;