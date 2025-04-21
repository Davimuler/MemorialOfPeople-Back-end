const mongoose = require('mongoose');

const manufacturerRateSchema = new mongoose.Schema({
    clients: { type: Number, required: true },
    percent: { type: Number, required: true }
});

const priceSchema = new mongoose.Schema({
    countryCode: {
        type: String,
        required: true,
        enum: ['ua', 'eng', 'ro', 'de', 'pl', 'it', 'fr', 'es', 'cs', 'sk']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        enum: ['UAH', 'GBP', 'RON', 'EUR', 'PLN', 'CZK']
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const siteSettingsSchema = new mongoose.Schema({
    exclusivePartner: { type: Number, required: true, default: 20 },
    clientDiscount: { type: Number, required: true, default: 5 },
    manufacturerRates: [manufacturerRateSchema],
    siteOwner: { type: Number, required: true, default: 50 },
    prices: [priceSchema]
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);