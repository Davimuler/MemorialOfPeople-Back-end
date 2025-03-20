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

module.exports = { saveDraft,updateDraftPaymentStatus, getDraftsByEmail,getDraftById, updateDraft };