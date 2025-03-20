const SupportTicket = require('../models/SupportTicket');

// Создание нового чата (если его нет)
exports.createTicket = async (req, res) => {
    const { userEmail, message } = req.body;

    try {
        // Проверяем, есть ли уже открытый чат для этого пользователя
        let ticket = await SupportTicket.findOne({ userEmail, status: 'open' });

        if (!ticket) {
            // Если чата нет, создаем новый
            ticket = new SupportTicket({
                userEmail,
                messages: [{ sender: 'user', text: message }],
            });
        } else {
            // Если чат уже есть, добавляем новое сообщение
            ticket.messages.push({ sender: 'user', text: message });
        }

        await ticket.save();
        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

// Получение всех чатов (для поддержки)
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

// Получение чата по почте пользователя
exports.getTicketByEmail = async (req, res) => {
    const { userEmail } = req.query;  // Почта теперь извлекается из тела запроса

    try {
        const ticket = await SupportTicket.findOne({ userEmail, status: 'open' });
        if (!ticket) {
            return res.status(404).json({ message: 'Чат не знайдено' });
        }
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

// Отправка сообщения в чат
exports.sendMessage = async (req, res) => {
    const { userEmail, sender, text } = req.body;  // Почта теперь извлекается из тела запроса

    try {
        const ticket = await SupportTicket.findOne({ userEmail, status: 'open' });
        if (!ticket) {
            return res.status(404).json({ message: 'Чат не знайдено' });
        }

        ticket.messages.push({ sender, text });
        await ticket.save();

        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

// Закрытие чата
exports.closeTicket = async (req, res) => {
    const { userEmail } = req.body;  // Почта теперь извлекается из тела запроса

    try {
        const ticket = await SupportTicket.findOne({ userEmail, status: 'open' });
        if (!ticket) {
            return res.status(404).json({ message: 'Чат не знайдено' });
        }

        ticket.status = 'closed';
        await ticket.save();

        res.status(200).json({ message: 'Чат успішно закрито' });
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};
