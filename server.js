const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Импортируем CORS
const multer = require('multer'); // Для обработки загрузки файлов
const { google } = require('googleapis'); // Для работы с Google Drive API
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile'); // Импортируем маршруты для профиля

dotenv.config();

const app = express();
app.use(express.json()); // Для обработки JSON в теле запроса
app.use(cors()); // Разрешаем все CORS-запросы

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Подключено к MongoDB'))
    .catch((error) => console.error('Ошибка подключения:', error));

// Настройка Multer для загрузки файлов
const upload = multer({ dest: 'uploads/' }); // Временное хранилище для файлов

// Путь к JSON-файлу с ключами сервисного аккаунта
const KEYFILEPATH = path.join(__dirname, 'service-account-keys.json');

// Права доступа для Google Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive'];

// Авторизация через сервисный аккаунт
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

// Загрузка файла на Google Drive
const uploadFile = async (file) => {
    const drive = google.drive({ version: 'v3', auth });

    // Метаданные файла
    const fileMetadata = {
        name: file.originalname, // Имя файла
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID], // ID папки на Google Drive
    };

    // Медиа-данные файла
    const media = {
        mimeType: file.mimetype, // Тип файла
        body: fs.createReadStream(file.path), // Поток для чтения файла
    };

    // Загрузка файла
    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id', // Возвращаем только ID файла
    });

    // Удаляем временный файл
    fs.unlinkSync(file.path);

    return response.data.id;
};

// Роут для загрузки файла
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Файл не выбран.');
        }

        const fileId = await uploadFile(req.file);
        res.send({ message: 'Файл успешно загружен!', fileId });
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        res.status(500).send('Ошибка загрузки файла.');
    }
});

// Маршруты
app.use('/api/auth', authRoutes); // Маршруты для аутентификации
app.use('/api/profile', profileRoutes); // Маршруты для работы с профилем

// Тестовый маршрут
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});