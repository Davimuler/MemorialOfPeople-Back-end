const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
    exclusivePartner: { type: Number, required: true, default: 20 },
    clientDiscount: { type: Number, required: true, default: 5 },
    manufacturerRates: [
        {
            clients: { type: Number, required: true },
            percent: { type: Number, required: true },
        },
    ],
    siteOwner: { type: Number, required: true, default: 50 },
    countryPrices: [
        {
            countryCode: { type: String, required: true },
            price: { type: Number, required: true },
        },
    ],
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);