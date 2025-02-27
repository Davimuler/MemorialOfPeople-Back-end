const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    quote: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    mainPhoto: {
        type: String, // URL или base64-строка
        required: true,
    },
    gallery: {
        type: [String], // Массив URL или base64-строк
        default: [],
    },
    birthDay: {
        type: Number,
        required: true,
    },
    birthMonth: {
        type: String,
        required: true,
    },
    birthYear: {
        type: Number,
        required: true,
    },
    creatorId: {
        type:String ,// Идентификатор создателя профиля
        ref: "", // Ссылка на модель пользователя

    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Profile", ProfileSchema);