const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
dotenv.config();

const app = express();
app.use(express.json()); // Для обработки JSON в теле запроса

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Подключено к MongoDB'))
    .catch((error) => console.error('Ошибка подключения:', error));

// Маршруты
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
