// models/Payments.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: 'pending' },
    liqpayOrderId: { type: String },
    payment_id: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', PaymentSchema);