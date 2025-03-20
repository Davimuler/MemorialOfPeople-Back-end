const mongoose = require('mongoose');

const monumentSchema = new mongoose.Schema({
    imgSrc: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    section: {
        type: String,
        required: true,
        enum: ['Granite Monuments', 'Marble Monuments', 'Other Materials', 'Additional Services']
    },
    creatorEmail: { type: String, required: true },
    country: { type: String, required: true }, // Новое поле: страна
    city: { type: String, required: true }     // Новое поле: город
});

module.exports = mongoose.model('Monument', monumentSchema);