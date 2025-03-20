const mongoose = require("mongoose");

const DraftSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: {
        type: String,
        required: true,
    },
    quote: {
        type: String,
    },
    description: {
        type: String,
    },
    mainPhoto: {
        type: String, // Ссылка на фото в Cloudinary
    },
    gallery: {
        type: [String], // Массив ссылок на фото в Cloudinary
    },
    birthDay: {
        type: String,
    },
    birthMonth: {
        type: String,
    },
    birthYear: {
        type: String,
    },
    deathDay: {
        type: String,
    },
    deathMonth: {
        type: String,
    },
    deathYear: {
        type: String,
    },
    youtubeVideoUrl: {
        type: String,
    },
    paid: {
        type: Boolean,
        default: false, // По умолчанию черновик не оплачен
    },
}, { timestamps: true });

module.exports = mongoose.model("Draft", DraftSchema);