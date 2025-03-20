// controllers/orderController.js
const Order = require('../models/Order');

// Створення нового замовлення
exports.createOrder = async (req, res) => {
    try {
        const { pageName, tabletSize, deliveryAddress, paymentMethod, country, city, email } = req.body;

        // Валідація email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Будь ласка, введіть коректну електронну пошту' });
        }

        const newOrder = new Order({
            pageName,
            tabletSize,
            deliveryAddress,
            paymentMethod,
            country,
            city,
            email, // Додаємо пошту заказчика
        });

        await newOrder.save();
        res.status(201).json({ message: 'Замовлення успішно створено', order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при створенні замовлення', error });
    }
};

// Видалення замовлення
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOrder = await Order.findByIdAndDelete(id);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }
        res.status(200).json({ message: 'Замовлення успішно видалено', order: deletedOrder });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при видаленні замовлення', error });
    }
};

// Оновлення статусу замовлення
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Перевірка, чи статус є допустимим
        if (!['pending', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Невірний статус замовлення' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }

        res.status(200).json({ message: 'Статус замовлення успішно оновлено', order: updatedOrder });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при оновленні статусу замовлення', error });
    }
};
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find(); // Отримуємо всі замовлення з бази даних
        res.status(200).json({ message: 'Замовлення успішно отримано', orders });
    } catch (error) {
        res.status(500).json({ message: 'Помилка при отриманні замовлень', error });
    }
};