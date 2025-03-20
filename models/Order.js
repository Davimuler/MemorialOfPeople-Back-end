// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    pageName: { type: String, required: true }, // Назва сторінки
    tabletSize: { type: String, required: true }, // Розмір таблички
    deliveryAddress: { type: String, required: true }, // Адреса доставки
    paymentMethod: { type: String, required: true }, // Спосіб оплати
    country: { type: String, required: true }, // Країна
    city: { type: String, required: true }, // Місто
    email: { type: String, required: true }, // Пошта заказчика
    status: { type: String, default: 'pending', enum: ['pending', 'completed'] }, // Статус замовлення
    createdAt: { type: Date, default: Date.now }, // Дата створення
});

module.exports = mongoose.model('Order', orderSchema);