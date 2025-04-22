// controllers/adminController.js
const User = require('../models/User');

const addFreeProfiles = async (req, res) => {
    try {
        const { email, count } = req.body;

        if (!email || !count || count <= 0) {
            return res.status(400).json({
                message: 'Необходимо указать email и положительное количество профилей'
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        user.freeProfilesAvailable += parseInt(count);
        await user.save();

        res.status(200).json({
            message: `Пользователю ${email} добавлено ${count} бесплатных профилей`,
            freeProfilesAvailable: user.freeProfilesAvailable,
        });
    } catch (error) {
        console.error('Ошибка при добавлении бесплатных профилей:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при добавлении бесплатных профилей' });
    }
};

const getUserFreeProfiles = async (req, res) => {
    try {
        const { email } = req.params;

        const user = await User.findOne({ email }).select('freeProfilesAvailable freeProfilesUsed email userStatus');
        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.status(200).json({
            email: user.email,
            userStatus: user.userStatus,
            freeProfilesAvailable: user.freeProfilesAvailable,
            freeProfilesUsed: user.freeProfilesUsed,
        });
    } catch (error) {
        console.error('Ошибка при получении информации о бесплатных профилях:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при получении информации о бесплатных профилях' });
    }
};

module.exports = {
    addFreeProfiles,
    getUserFreeProfiles,
};