const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true, enum: ['user', 'support'] }, // Кто отправил сообщение
    text: { type: String, required: true }, // Текст сообщения
    timestamp: { type: Date, default: Date.now }, // Время отправки
});

const supportTicketSchema = new mongoose.Schema({
    userEmail: { type: String, required: true }, // Почта пользователя
    status: { type: String, required: true, enum: ['open', 'closed'], default: 'open' }, // Статус чата
    messages: [messageSchema], // Сообщения в чате
    createdAt: { type: Date, default: Date.now }, // Время создания чата
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);