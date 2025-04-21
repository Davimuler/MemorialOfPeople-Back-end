const SiteSettings = require('../models/SiteSettings');

exports.getSettings = async (req, res) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings) {
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
                countryPrices: [
                    { countryCode: 'ua', price: 100 },
                    { countryCode: 'eng', price: 200 },
                    { countryCode: 'ro', price: 150 },
                    { countryCode: 'de', price: 250 },
                    { countryCode: 'pl', price: 180 },
                    { countryCode: 'it', price: 220 },
                    { countryCode: 'fr', price: 230 },
                    { countryCode: 'es', price: 210 },
                    { countryCode: 'cs', price: 170 },
                    { countryCode: 'sk', price: 190 },
                ],
            });
            await defaultSettings.save();
            return res.status(200).json(defaultSettings);
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { exclusivePartner, clientDiscount, manufacturerRates, siteOwner, countryPrices } = req.body;
        const settings = await SiteSettings.findOne();

        if (!settings) {
            return res.status(404).json({ message: 'Налаштування не знайдено' });
        }

        settings.exclusivePartner = exclusivePartner;
        settings.clientDiscount = clientDiscount;
        settings.manufacturerRates = manufacturerRates;
        settings.siteOwner = siteOwner;
        settings.countryPrices = countryPrices;

        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};