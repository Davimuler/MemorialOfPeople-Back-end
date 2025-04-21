const SiteSettings = require('../models/SiteSettings');

// Get all settings including prices
exports.getSettings = async (req, res) => {
    try {
        let settings = await SiteSettings.findOne();
        if (!settings) {
            const defaultSettings = new SiteSettings({
                exclusivePartner: 20,
                clientDiscount: 5,
                manufacturerRates: [
                    { clients: 10, percent: 10 },
                    { clients: 20, percent: 15 },
                    { clients: 30, percent: 20 },
                    { clients: 31, percent: 25 }
                ],
                siteOwner: 50,
                prices: [
                    { countryCode: 'ua', price: 0, currency: 'UAH' },
                    { countryCode: 'eng', price: 0, currency: 'GBP' },
                    { countryCode: 'ro', price: 0, currency: 'RON' },
                    { countryCode: 'de', price: 0, currency: 'EUR' },
                    { countryCode: 'pl', price: 0, currency: 'PLN' },
                    { countryCode: 'it', price: 0, currency: 'EUR' },
                    { countryCode: 'fr', price: 0, currency: 'EUR' },
                    { countryCode: 'es', price: 0, currency: 'EUR' },
                    { countryCode: 'cs', price: 0, currency: 'CZK' },
                    { countryCode: 'sk', price: 0, currency: 'EUR' }
                ]
            });
            await defaultSettings.save();
            return res.status(200).json(defaultSettings);
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

// Update settings (excluding prices)
exports.updateSettings = async (req, res) => {
    try {
        const { exclusivePartner, clientDiscount, manufacturerRates, siteOwner } = req.body;
        let settings = await SiteSettings.findOne();

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

// Get price for a specific country
exports.getPrice = async (req, res) => {
    try {
        const settings = await SiteSettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Налаштування не знайдено' });
        }

        const priceData = settings.prices.find(
            (price) => price.countryCode === req.params.countryCode
        );

        if (!priceData) {
            return res.status(404).json({ message: 'Ціна для цієї країни не знайдена' });
        }

        res.status(200).json(priceData);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

// Update price for a specific country
exports.updatePrice = async (req, res) => {
    try {
        const { price, currency } = req.body;
        const { countryCode } = req.params;

        if (!price || !currency) {
            return res.status(400).json({ message: 'Ціна та валюта обов’язкові' });
        }

        let settings = await SiteSettings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'Налаштування не знайдено' });
        }

        const priceIndex = settings.prices.findIndex(
            (p) => p.countryCode === countryCode
        );

        if (priceIndex === -1) {
            settings.prices.push({
                countryCode,
                price,
                currency,
                updatedAt: Date.now()
            });
        } else {
            settings.prices[priceIndex].price = price;
            settings.prices[priceIndex].currency = currency;
            settings.prices[priceIndex].updatedAt = Date.now();
        }

        await settings.save();
        res.status(200).json(settings.prices.find((p) => p.countryCode === countryCode));
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};