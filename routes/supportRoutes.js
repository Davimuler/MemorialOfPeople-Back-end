const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

// Создание нового чата
router.post('/tickets', supportController.createTicket);

// Получение всех чатов (для поддержки)
router.get('/tickets', supportController.getAllTickets);

// Получение чата по почте пользователя
router.get('/tickets/gmail', supportController.getTicketByEmail);  // Почта теперь из тела запроса

// Отправка сообщения в чат
router.post('/tickets/messages', supportController.sendMessage);  // Почта теперь из тела запроса

// Закрытие чата
router.put('/tickets/close', supportController.closeTicket);  // Почта теперь из тела запроса

module.exports = router;
