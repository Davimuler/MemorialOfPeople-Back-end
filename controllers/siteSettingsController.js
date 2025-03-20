const SiteSettings = require('../models/SiteSettings');

// Получение текущих настроек
exports.getSettings = async (req, res) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings) {
            // Если настройки отсутствуют, создаем их с дефолтными значениями
            const defaultSettings = new SiteSettings({
                exclusivePartner: 20,
                clientDiscount: 5,
                manufacturerRates: [
                    { clients: 10, percent: 10 },
                    { clients: 20, percent: 15 },
                    { clients: 30, percent: 20 },
                    { clients: 31, percent: 25 },
                ],
                siteOwner: 50,
            });
            await defaultSettings.save();
            return res.status(200).json(defaultSettings);
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

// Обновление настроек
exports.updateSettings = async (req, res) => {
    try {
        const { exclusivePartner, clientDiscount, manufacturerRates, siteOwner } = req.body;
        const settings = await SiteSettings.findOne();

        if (!settings) {
            return res.status(404).json({ message: 'Налаштування не знайдено' });
        }

        settings.exclusivePartner = exclusivePartner;
        settings.clientDiscount = clientDiscount;
        settings.manufacturerRates = manufacturerRates;
        settings.siteOwner = siteOwner;

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};