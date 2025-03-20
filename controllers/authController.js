const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const admin = require('../firebaseAdmin');


getUserByEmail = async (req, res) => {
    try {
        const { email } = req.body;

        // Проверка наличия email
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Необхідно надати email',
            });
        }

        // Поиск пользователя по email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Користувача не знайдено',
            });
        }

        // Генерация JWT токена
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d', // Токен действителен 30 дней
        });

        // Возвращаем данные пользователя и токен
        const userResponse = user.toObject(); // Преобразуем в обычный объект
        delete userResponse.password; // Удаляем пароль из ответа

        res.status(200).json({
            success: true,
            token, // Возвращаем токен
            user: userResponse, // Возвращаем данные пользователя
        });
    } catch (error) {
        console.error('Error in getUserByEmail:', error);
        res.status(500).json({
            success: false,
            message: 'Помилка сервера при отриманні даних користувача',
        });
    }
};

googleLogin = async (req, res) => {
    try {
        const { accessToken, email, displayName, photoURL, referralCode } = req.body;

        // Проверка токена через Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(accessToken);
        const { uid } = decodedToken;

        // Поиск пользователя по email
        let user = await User.findOne({ email });

        if (!user) {
            // Если пользователь не существует, создаем нового
            user = new User({
                uid,
                email,
                displayName,
                photoURL,
                provider: 'google',
                referralCode: referralCode || null, // Добавляем referralCode, если он есть
            });
        } else {
            // Если пользователь уже существует, обновляем его данные
            user.uid = uid;
            user.displayName = displayName;
            user.photoURL = photoURL;
            user.provider = 'google'; // Обновляем провайдера
            if (referralCode) {
                user.referralCode = referralCode; // Обновляем referralCode, если он есть
            }
        }

        // Сохраняем пользователя
        await user.save();

        // Возвращаем все данные пользователя
        const userResponse = user.toObject(); // Преобразуем в обычный объект
        delete userResponse.password; // Удаляем пароль, если он есть

        res.status(200).json({
            success: true,
            user: userResponse, // Возвращаем весь объект пользователя
        });
    } catch (error) {
        console.error('Error in googleLogin:', error);
        res.status(500).json({ success: false, message: 'Помилка авторизації через Google' });
    }
};

// User registration
const registerUser = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // New user creation
        const user = new User({ firstName, lastName, email, phoneNumber, password });
        await user.save();

        // JWT token creation
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.status(201).json({
            token,
            user: user,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// User log in
const authUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Wrong input data' });
        }

        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Wrong input data' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.json({
            token,
            user: user,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

updateReferralCode = async (req, res) => {
    const { userId, referralCode } = req.body;

    if (!userId || !referralCode) {
        return res.status(400).json({ message: 'Необхідно надати userId та referralCode' });
    }

    try {
        // Оновлення користувача в базі даних
        const updatedUser = await User.findOneAndUpdate(
            { uid: userId },
            { $set: { referralCode } },
            { new: true } // Повертає оновлений документ
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        res.status(200).json({ message: 'Реферальний код успішно оновлено', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера при оновленні реферального коду' });
    }
};
const incrementReferralCount = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'Необхідно надати userId' });
    }

    try {
        // Находим пользователя и увеличиваем referralCount на 1
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $inc: { referralCount: 1 } }, // Используем $inc для инкремента
            { new: true } // Возвращаем обновленный документ
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        res.status(200).json({ message: 'Реферальний лічильник успішно оновлено', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера при оновленні реферального лічильника' });
    }
};
const incrementReferralCountByCode = async (req, res) => {
    const { referralCode } = req.body;

    if (!referralCode) {
        return res.status(400).json({ message: 'Необхідно надати referralCode' });
    }

    try {
        // Находим пользователя по реферальному коду
        const user = await User.findOne({ referralCode });

        if (!user) {
            return res.status(404).json({ message: 'Користувача з таким реферальним кодом не знайдено' });
        }

        // Увеличиваем referralCount на 1
        user.referralCount += 1;
        await user.save();

        res.status(200).json({ message: 'Реферальний лічильник успішно оновлено', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера при оновленні реферального лічильника' });
    }
};
const updateDiscountStatus = async (req, res) => {
    const { userId, isDiscount } = req.body;

    if (userId === undefined || isDiscount === undefined) {
        return res.status(400).json({ message: 'Необхідно надати userId та isDiscount' });
    }

    try {
        // Находим пользователя и обновляем поле isDiscount
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId }, // Ищем пользователя по ID
            { $set: { isDiscount } }, // Обновляем поле isDiscount
            { new: true } // Возвращаем обновленный документ
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        res.status(200).json({ message: 'Статус знижки успішно оновлено', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера при оновленні статусу знижки' });
    }
};
const becomePartner = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'Необхідно надати userId' });
    }

    try {
        // Находим пользователя и обновляем его статус на "partner"
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId }, // Ищем пользователя по ID
            { $set: { userStatus: 'partner' } }, // Обновляем статус на "partner"
            { new: true } // Возвращаем обновленный документ
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        res.status(200).json({ message: 'Статус успішно оновлено на партнера', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Помилка сервера при оновленні статусу на партнера' });
    }
};


module.exports = {becomePartner ,updateDiscountStatus, incrementReferralCountByCode, incrementReferralCount, registerUser, authUser,googleLogin, updateReferralCode,getUserByEmail};
