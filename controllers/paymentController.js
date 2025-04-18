const crypto = require('crypto');
const Payment = require('../models/Payments');

const publicKey = process.env.LIQPAY_PUBLIC_KEY;
const privateKey = process.env.LIQPAY_PRIVATE_KEY;

// Функция для генерации data и signature
const generateLiqPayData = (params) => {
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = crypto
        .createHash('sha1')
        .update(privateKey + data + privateKey)
        .digest('base64');
    return { data, signature };
};

// Создание платежа
exports.createPayment = async (req, res) => {
    try {
        const { amount, currency, description } = req.body;
        const orderId = `order_${Date.now()}`; // Уникальный ID заказа

        // Сохранение платежа в MongoDB
        const payment = new Payment({
            orderId,
            amount,
            currency,
            description,
            status: 'pending',
        });
        await payment.save();

        // Параметры для LiqPay
        const params = {
            public_key: publicKey,
            version: '3',
            action: 'pay',
            amount,
            currency,
            description,
            order_id: orderId,
            language: 'ru',
            server_url: 'https://api.livingmemory.pro/api/payment/callback', // Замените на ваш URL
            result_url: 'http://localhost:3000/success', // Замените на ваш фронтенд
        };

        const { data, signature } = generateLiqPayData(params);
        res.json({ data, signature });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Ошибка при создании платежа' });
    }
};

// Обработка callback от LiqPay
exports.handleCallback = async (req, res) => {
    try {
        const { data, signature } = req.body;

        // Проверка подписи
        const generatedSignature = crypto
            .createHash('sha1')
            .update(privateKey + data + privateKey)
            .digest('base64');
        if (signature !== generatedSignature) {
            return res.status(400).json({ message: 'Недействительная подпись' });
        }

        // Декодирование данных
        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));

        // Обновление статуса платежа
        const payment = await Payment.findOne({ orderId: decodedData.order_id });
        if (payment) {
            payment.status = decodedData.status;
            payment.liqpayOrderId = decodedData.payment_id;
            await payment.save();
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error in callback:', error);
        res.status(500).json({ message: 'Ошибка в callback' });
    }
};