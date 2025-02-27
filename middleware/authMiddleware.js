const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware для проверки аутентификации
const protect = async (req, res, next) => {
    let token;

    // Проверяем заголовок Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Извлекаем токен
            token = req.headers.authorization.split(' ')[1];

            // Декодируем токен
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Находим пользователя по ID из токена
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };