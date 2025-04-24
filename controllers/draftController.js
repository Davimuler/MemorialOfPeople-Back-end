const Draft = require('../models/Draft');
const User = require('../models/User');

// controllers/draftController.js
const saveDraft = async (req, res) => {
    try {
        const {
            email,
            name,
            quote,
            description,
            mainPhoto,
            gallery,
            birthDay,
            birthMonth,
            birthYear,
            deathDay,
            deathMonth,
            deathYear,
            youtubeVideoUrl,
            orderId,
            pageType,
            country, // New country field
        } = req.body;

        // Валидация обязательных полей
        if (!email || !name) {
            return res.status(400).json({ message: 'Отсутствуют обязательные поля: email или name' });
        }

        // Находим пользователя
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Проверяем, есть ли у пользователя доступные бесплатные профили
        const hasFreeProfiles = user.freeProfilesAvailable > 0;

        // Проверка, существует ли неоплаченный черновик для email
        let draft = await Draft.findOne({ email, paid: false });
        if (draft) {
            // Обновляем существующий черновик
            draft.name = name;
            draft.quote = quote;
            draft.description = description;
            draft.mainPhoto = mainPhoto;
            draft.gallery = gallery;
            draft.birthDay = birthDay;
            draft.birthMonth = birthMonth;
            draft.birthYear = birthYear;
            draft.deathDay = deathDay;
            draft.deathMonth = deathMonth;
            draft.deathYear = deathYear;
            draft.youtubeVideoUrl = youtubeVideoUrl;
            draft.country = country; // Update country
            draft.pageType = pageType;

            // Если передали orderId или есть бесплатные профили
            if (orderId) {
                draft.orderId = orderId;
                draft.paid = true;
            } else if (hasFreeProfiles) {
                draft.paid = true;
                draft.orderId = 'FREE_PROFILE';
                user.freeProfilesAvailable -= 1;
                user.freeProfilesUsed += 1;
                await user.save();
            }
        } else {
            // Создаем новый черновик
            draft = new Draft({
                email,
                name,
                quote,
                description,
                mainPhoto,
                gallery,
                birthDay,
                birthMonth,
                birthYear,
                deathDay,
                deathMonth,
                deathYear,
                youtubeVideoUrl,
                country, // Set country
                pageType,
                paid: orderId ? true : hasFreeProfiles,
                orderId: orderId || (hasFreeProfiles ? 'FREE_PROFILE' : undefined),
            });

            // Если используется бесплатный профиль, обновляем счетчики
            if (hasFreeProfiles && !orderId) {
                user.freeProfilesAvailable -= 1;
                user.freeProfilesUsed += 1;
                await user.save();
            }
        }

        await draft.save();

        res.status(201).json({
            message: 'Черновик успешно сохранен',
            draftId: draft._id,
            paid: draft.paid,
            freeProfilesAvailable: user.freeProfilesAvailable,
            freeProfilesUsed: user.freeProfilesUsed,
        });
    } catch (error) {
        console.error('Ошибка при сохранении черновика:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при сохранении черновика' });
    }
};
// Остальные методы остаются без изменений
const updateDraftPaymentStatus = async (req, res) => {
    try {
        const { draftId } = req.params;
        const { paid } = req.body;

        // Валидация
        if (typeof paid !== 'boolean') {
            return res.status(400).json({ message: 'Поле paid должно быть true или false' });
        }

        const updatedDraft = await Draft.findByIdAndUpdate(
            draftId,
            { paid },
            { new: true }
        );

        if (!updatedDraft) {
            return res.status(404).json({ message: 'Черновик не найден' });
        }

        res.status(200).json({
            message: 'Статус оплаты обновлен',
            draft: updatedDraft,
        });
    } catch (error) {
        console.error('Ошибка при обновлении статуса оплаты:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при обновлении статуса оплаты' });
    }
};

const getDraftsByEmail = async (req, res) => {
    try {
        const { email } = req.params;

        const drafts = await Draft.find({ email });

        if (!drafts || drafts.length === 0) {
            return res.status(404).json({ message: 'Черновики не найдены' });
        }

        res.status(200).json({
            message: 'Черновики успешно найдены',
            drafts,
        });
    } catch (error) {
        console.error('Ошибка при поиске черновиков:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при поиске черновиков' });
    }
};

const getDraftById = async (req, res) => {
    try {
        const { draftId } = req.params;

        const draft = await Draft.findById(draftId);

        if (!draft) {
            return res.status(404).json({ message: 'Черновик не найден' });
        }

        res.status(200).json({
            message: 'Черновик успешно найден',
            draft,
        });
    } catch (error) {
        console.error('Ошибка при поиске черновика:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при поиске черновика' });
    }
};

const updateDraft = async (req, res) => {
    try {
        const { draftId } = req.params;
        const updateData = req.body;

        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Нет данных для обновления' });
        }

        const updatedDraft = await Draft.findByIdAndUpdate(
            draftId,
            updateData,
            { new: true }
        );

        if (!updatedDraft) {
            return res.status(404).json({ message: 'Черновик не найден' });
        }

        res.status(200).json({
            message: 'Черновик успешно обновлен',
            draft: updatedDraft,
        });
    } catch (error) {
        console.error('Ошибка при обновлении черновика:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при обновлении черновика' });
    }
};

const searchDraftsByName = async (req, res) => {
    try {
        const { name } = req.query;
        const { email } = req.params;

        const searchConditions = {};

        if (name) {
            searchConditions.name = { $regex: name, $options: 'i' };
        }

        if (email) {
            searchConditions.email = email;
        }

        if (!name && !email) {
            return res.status(400).json({ message: 'Необходимо указать имя для поиска или email' });
        }

        const drafts = await Draft.find(searchConditions);

        if (!drafts || drafts.length === 0) {
            return res.status(404).json({ message: 'Черновики не найдены' });
        }

        res.status(200).json({
            message: 'Черновики успешно найдены',
            drafts,
        });
    } catch (error) {
        console.error('Ошибка при поиске черновиков:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при поиске черновиков' });
    }
};

const getDraftsPaginated = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { email } = req.query;

        const query = {};
        if (email) {
            query.email = email;
        }

        const skip = (page - 1) * limit;

        const drafts = await Draft.find(query)
            .skip(skip)
            .limit(limit)
            .exec();

        const total = await Draft.countDocuments(query);

        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            message: 'Черновики успешно получены',
            drafts,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error('Ошибка при получении черновиков с пагинацией:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при получении черновиков с пагинацией' });
    }
};

module.exports = {
    saveDraft,
    updateDraftPaymentStatus,
    getDraftsByEmail,
    getDraftById,
    updateDraft,
    searchDraftsByName,
    getDraftsPaginated,
};