const Profile = require("../models/Profile");
const User = require("../models/User");

// Создание профиля
exports.createProfile = async (req, res) => {
    try {
        const { name, quote, description, mainPhoto, gallery, birthDay, birthMonth, birthYear,creatorId } = req.body;


        // Проверка наличия обязательных полей
        if (!name || !quote || !description || !mainPhoto || !birthDay || !birthMonth || !birthYear) {
            return res.status(400).json({ message: "Будь ласка, заповніть всі обов'язкові поля" });
        }

        // Проверка, что пользователь существует
        const user = await User.findById(creatorId);
        if (!user) {
            return res.status(404).json({ message: "Користувач не знайдений" });
        }

        const newProfile = new Profile({
            name,
            quote,
            description,
            mainPhoto,
            gallery,
            birthDay,
            birthMonth,
            birthYear,
            creatorId,
        });

        const savedProfile = await newProfile.save();

        // Добавляем профиль в массив createdProfiles пользователя
        await User.findByIdAndUpdate(creatorId, {
            $push: { createdProfiles: savedProfile._id }
        });

        res.status(201).json(savedProfile);
    } catch (error) {
        res.status(500).json({ message: "Помилка при створенні профілю", error: error.message });
    }
};

// Получение всех профилей (с пагинацией)
exports.getAllProfiles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Номер страницы
        const limit = parseInt(req.query.limit) || 10; // Количество профилей на странице
        const skip = (page - 1) * limit;

        const profiles = await Profile.find()
            .skip(skip)
            .limit(limit)
            .populate("creatorId", "firstName lastName email");

        const totalProfiles = await Profile.countDocuments();

        res.status(200).json({
            profiles,
            currentPage: page,
            totalPages: Math.ceil(totalProfiles / limit),
            totalProfiles,
        });
    } catch (error) {
        res.status(500).json({ message: "Помилка при отриманні профілів", error: error.message });
    }
};

// Получение профиля по ID
exports.getProfileById = async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id).populate("creatorId", "firstName lastName email");
        if (!profile) {
            return res.status(404).json({ message: "Профіль не знайдено" });
        }
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: "Помилка при отриманні профілю", error: error.message });
    }
};

// Обновление профиля
exports.updateProfile = async (req, res) => {
    try {
        const { name, quote, description, mainPhoto, gallery, birthDay, birthMonth, birthYear } = req.body;
        const profile = await Profile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({ message: "Профіль не знайдено" });
        }

        // Проверка, что пользователь обновляет свой профиль
        if (profile.creatorId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Немає доступу" });
        }

        profile.name = name || profile.name;
        profile.quote = quote || profile.quote;
        profile.description = description || profile.description;
        profile.mainPhoto = mainPhoto || profile.mainPhoto;
        profile.gallery = gallery || profile.gallery;
        profile.birthDay = birthDay || profile.birthDay;
        profile.birthMonth = birthMonth || profile.birthMonth;
        profile.birthYear = birthYear || profile.birthYear;

        await profile.save();
        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: "Помилка при оновленні профілю", error: error.message });
    }
};

// Удаление профиля
exports.deleteProfile = async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.id);

        if (!profile) {
            return res.status(404).json({ message: "Профіль не знайдено" });
        }

        // Проверка, что пользователь удаляет свой профиль
        if (profile.creatorId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Немає доступу" });
        }

        await profile.remove();

        // Удаляем профиль из массива createdProfiles пользователя
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { createdProfiles: profile._id }
        });

        res.status(200).json({ message: "Профіль видалено" });
    } catch (error) {
        res.status(500).json({ message: "Помилка при видаленні профілю", error: error.message });
    }
};