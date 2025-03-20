// routes/orderRoutes.js
const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Створення нового замовлення
router.post('/order', orderController.createOrder);

// Видалення замовлення
router.delete('/order/:id', orderController.deleteOrder);

// Оновлення статусу замовлення
router.put('/order/:id/status', orderController.updateOrderStatus);
router.get('/orders', orderController.getAllOrders); // Новий маршрут для отримання всіх замовлень


module.exports = router;