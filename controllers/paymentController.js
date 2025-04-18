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
        const { amount, currency, description, profileData } = req.body;
        const orderId = `order_${Date.now()}`;

        const payment = new Payment({
            orderId,
            amount,
            currency,
            description,
            profileData,   // ⬅️ сюда добавляем профиль который нужно создать после оплаты
            status: 'pending',
        });
        await payment.save();

        const params = {
            public_key: publicKey,
            version: '3',
            action: 'pay',
            amount,
            currency,
            description,
            order_id: orderId,
            language: 'ru',
            server_url: 'https://api.livingmemory.pro/api/payment/callback',
            result_url: 'http://localhost:3000/success',
        };

        const { data, signature } = generateLiqPayData(params);
        res.json({ data, signature, orderId });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Ошибка при создании платежа' });
    }
};

const Draft = require('../models/Draft');

exports.handleCallback = async (req, res) => {
    try {
        const { data, signature } = req.body;

        const generatedSignature = crypto
            .createHash('sha1')
            .update(privateKey + data + privateKey)
            .digest('base64');
        if (signature !== generatedSignature) {
            return res.status(400).json({ message: 'Недействительная подпись' });
        }

        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));

        const payment = await Payment.findOne({ orderId: decodedData.order_id });
        if (!payment) return res.status(404).json({ message: 'Платеж не найден' });

        payment.status = decodedData.status;
        payment.liqpayOrderId = decodedData.payment_id;
        await payment.save();

        // === Если оплата успешна, создаем профиль ===
        if (decodedData.status === 'success') {
            const {
                email,
                name,
                quote,
                description,
                mainPhoto,
                gallery,
                birthDay,
                birthMonth,
                birthYear,
                deathDay,
                deathMonth,
                deathYear,
                youtubeVideoUrl,
            } = payment.profileData;

            const draft = new Draft({
                email,
                name,
                quote,
                description,
                mainPhoto,
                gallery,
                birthDay,
                birthMonth,
                birthYear,
                deathDay,
                deathMonth,
                deathYear,
                youtubeVideoUrl,
            });

            await draft.save();
            console.log(`Профиль создан для оплаты: ${decodedData.order_id}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error in callback:', error);
        res.status(500).json({ message: 'Ошибка в callback' });
    }
};