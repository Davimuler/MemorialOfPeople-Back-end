const Draft = require("../models/Draft");

// Сохранение черновика
const saveDraft = async (req, res) => {
    try {
        const {
            email, // Email пользователя
            name,
            quote,
            description,
            mainPhoto, // Ссылка на главное фото
            gallery, // Массив ссылок на фотографии галереи
            birthDay,
            birthMonth,
            birthYear,
            deathDay,
            deathMonth,
            deathYear,
            youtubeVideoUrl,
        } = req.body;

        // Создание черновика
        const draft = new Draft({
            email, // Сохраняем email пользователя
            name,
            quote,
            description,
            mainPhoto, // Сохраняем ссылку на главное фото
            gallery, // Сохраняем массив ссылок на фотографии галереи
            birthDay,
            birthMonth,
            birthYear,
            deathDay,
            deathMonth,
            deathYear,
            youtubeVideoUrl,
        });

        await draft.save();

        res.status(201).json({
            message: "Черновик успешно сохранен",
            draftId: draft._id,
        });
    } catch (error) {
        console.error("Ошибка при сохранении черновика:", error);
        res.status(500).json({ message: "Ошибка при сохранении черновика" });
    }
};
const updateDraftPaymentStatus = async (req, res) => {
    try {
        const { draftId } = req.params; // Идентификатор черновика из URL
        const { paid } = req.body; // Новое значение paid (true/false)

        // Валидация
        if (typeof paid !== "boolean") {
            return res.status(400).json({ message: "Поле paid должно быть true или false" });
        }

        // Находим черновик и обновляем поле paid
        const updatedDraft = await Draft.findByIdAndUpdate(
            draftId,
            { paid }, // Обновляем поле paid
            { new: true } // Возвращаем обновленный документ
        );

        // Если черновик не найден
        if (!updatedDraft) {
            return res.status(404).json({ message: "Черновик не найден" });
        }

        // Успешный ответ
        res.status(200).json({
            message: "Статус оплаты обновлен",
            draft: updatedDraft,
        });
    } catch (error) {
        console.error("Ошибка при обновлении статуса оплаты:", error);
        res.status(500).json({ message: "Ошибка при обновлении статуса оплаты" });
    }
};
const getDraftsByEmail = async (req, res) => {
    try {
        const { email } = req.params; // Получаем email из параметров URL

        // Находим все черновики с указанным email
        const drafts = await Draft.find({ email });

        // Если черновики не найдены
        if (!drafts || drafts.length === 0) {
            return res.status(404).json({ message: "Черновики не найдены" });
        }

        // Успешный ответ
        res.status(200).json({
            message: "Черновики успешно найдены",
            drafts,
        });
    } catch (error) {
        console.error("Ошибка при поиске черновиков:", error);
        res.status(500).json({ message: "Ошибка при поиске черновиков" });
    }
};
const getDraftById = async (req, res) => {
    try {
        const { draftId } = req.params; // Получаем идентификатор черновика из параметров URL

        // Находим черновик по его идентификатору
        const draft = await Draft.findById(draftId);

        // Если черновик не найден
        if (!draft) {
            return res.status(404).json({ message: "Черновик не найден" });
        }

        // Успешный ответ
        res.status(200).json({
            message: "Черновик успешно найден",
            draft,
        });
    } catch (error) {
        console.error("Ошибка при поиске черновика:", error);
        res.status(500).json({ message: "Ошибка при поиске черновика" });
    }
};
const updateDraft = async (req, res) => {
    try {
        const { draftId } = req.params; // Идентификатор черновика из URL
        const updateData = req.body; // Данные для обновления

        // Проверяем, есть ли данные для обновления
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "Нет данных для обновления" });
        }

        // Находим черновик и обновляем его поля
        const updatedDraft = await Draft.findByIdAndUpdate(
            draftId,
            updateData, // Обновляем поля, переданные в теле запроса
            { new: true } // Возвращаем обновленный документ
        );

        // Если черновик не найден
        if (!updatedDraft) {
            return res.status(404).json({ message: "Черновик не найден" });
        }

        // Успешный ответ
        res.status(200).json({
            message: "Черновик успешно обновлен",
            draft: updatedDraft,
        });
    } catch (error) {
        console.error("Ошибка при обновлении черновика:", error);
        res.status(500).json({ message: "Ошибка при обновлении черновика" });
    }
};
const searchDraftsByName = async (req, res) => {
    try {
        const { name } = req.query; // Получаем имя из query параметров
        const { email } = req.params; // Получаем email из параметров URL (опционально)

        // Создаем объект для условия поиска
        const searchConditions = {};

        // Если передано имя, добавляем в условия поиска (регистронезависимый поиск)
        if (name) {
            searchConditions.name = { $regex: name, $options: 'i' };
        }

        // Если передан email, добавляем в условия поиска
        if (email) {
            searchConditions.email = email;
        }

        // Если нет ни имени ни email - возвращаем ошибку
        if (!name && !email) {
            return res.status(400).json({
                message: "Необходимо указать имя для поиска или email"
            });
        }

        // Ищем черновики по условиям
        const drafts = await Draft.find(searchConditions);

        // Если ничего не найдено
        if (!drafts || drafts.length === 0) {
            return res.status(404).json({
                message: "Черновики не найдены"
            });
        }

        // Успешный ответ
        res.status(200).json({
            message: "Черновики успешно найдены",
            drafts,
        });
    } catch (error) {
        console.error("Ошибка при поиске черновиков:", error);
        res.status(500).json({
            message: "Ошибка при поиске черновиков"
        });
    }
};
const getDraftsPaginated = async (req, res) => {
    try {
        // Получаем параметры запроса с дефолтными значениями
        const page = parseInt(req.query.page) || 1; // текущая страница (по умолчанию 1)
        const limit = parseInt(req.query.limit) || 10; // количество элементов на странице (по умолчанию 10)
        const { email } = req.query; // опциональный email для фильтрации

        // Создаем условия для поиска
        const query = {};
        if (email) {
            query.email = email;
        }

        // Вычисляем количество пропускаемых документов
        const skip = (page - 1) * limit;

        // Получаем черновики с пагинацией
        const drafts = await Draft.find(query)
            .skip(skip)
            .limit(limit)
            .exec();

        // Получаем общее количество черновиков (для информации о пагинации)
        const total = await Draft.countDocuments(query);

        // Вычисляем общее количество страниц
        const totalPages = Math.ceil(total / limit);

        // Успешный ответ
        res.status(200).json({
            message: "Черновики успешно получены",
            drafts,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error("Ошибка при получении черновиков с пагинацией:", error);
        res.status(500).json({ message: "Ошибка при получении черновиков с пагинацией" });
    }
};

module.exports = {
    saveDraft,
    updateDraftPaymentStatus,
    getDraftsByEmail,
    getDraftById,
    updateDraft,
    searchDraftsByName,
    getDraftsPaginated
};