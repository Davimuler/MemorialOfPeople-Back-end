const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create', paymentController.createPayment);
router.post('/callback', paymentController.handleCallback);
router.post('/check-status', paymentController.checkProfileStatus);

module.exports = router;