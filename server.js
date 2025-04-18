const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const draftRoutes = require('./routes/draft');
const siteSettingsRoutes = require('./routes/siteSettings');
const supportRoutes = require('./routes/supportRoutes');
const monumentsRouter = require('./routes/monument');
const orderRouter = require('./routes/order');
const paymentRoutes = require('./routes/payment');

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({
    origin: ["http://localhost:3000", "http://138.68.78.80" , 'https://livingmemory.pro','https://www.livingmemory.pro'], // Разрешаем запросы с фронтенда
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
}));

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Подключено к MongoDB'))
    .catch((error) => console.error('Ошибка подключения:', error));

// Настройка Multer
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Настройка Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Функция для загрузки файла на Cloudinary
const uploadToCloudinary = async (filePath) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'your_folder_name',
        });
        return result;
    } catch (error) {
        console.error('Ошибка загрузки файла на Cloudinary:', error);
        throw error;
    }
};

// Роут для загрузки файла на Cloudinary
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Файл не выбран.');
        }

        const result = await uploadToCloudinary(req.file.path);
        fs.unlinkSync(req.file.path);

        res.send({
            message: 'Файл успешно загружен на Cloudinary!',
            fileUrl: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        res.status(500).send('Ошибка загрузки файла.');
    }
});

// Роут для удаления файла с Cloudinary
app.delete('/api/files/:publicId', async (req, res) => {
    try {
        const publicId = req.params.publicId;
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.send({ message: 'Файл успешно удален с Cloudinary!' });
        } else {
            res.status(404).send('Файл не найден.');
        }
    } catch (error) {
        console.error('Ошибка удаления файла:', error);
        res.status(500).send('Ошибка удаления файла.');
    }
});

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/settings', siteSettingsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/monuments', monumentsRouter);
app.use('/api/order', orderRouter);
app.use('/api/payment', paymentRoutes);

// Тестовый маршрут
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Запуск сервера
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log('LiqPay тестовые ключи:', process.env.LIQPAY_PUBLIC_KEY ? 'Загружены' : 'Не найдены');
});