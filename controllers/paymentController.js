// controllers/paymentController.js
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payments');
const Draft = require('../models/Draft');

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

        // Проверка обязательных полей
        if (!amount || !currency || !description || !profileData.email || !profileData.name) {
            return res.status(400).json({ message: 'Отсутствуют обязательные поля: amount, currency, description, email или name' });
        }

        const orderId = `order_${uuidv4()}`;

        // Создание или обновление черновика
        let draft = await Draft.findOne({ email: profileData.email, paid: false });
        if (draft) {
            // Обновляем существующий черновик
            draft.name = profileData.name;
            draft.quote = profileData.quote;
            draft.description = profileData.description;
            draft.mainPhoto = profileData.mainPhoto;
            draft.gallery = profileData.gallery;
            draft.birthDay = profileData.birthDay;
            draft.birthMonth = profileData.birthMonth;
            draft.birthYear = profileData.birthYear;
            draft.deathDay = profileData.deathDay;
            draft.deathMonth = profileData.deathMonth;
            draft.deathYear = profileData.deathYear;
            draft.youtubeVideoUrl = profileData.youtubeVideoUrl;
            draft.orderId = orderId;
        } else {
            // Создаем новый черновик
            draft = new Draft({
                email: profileData.email,
                name: profileData.name,
                quote: profileData.quote,
                description: profileData.description,
                mainPhoto: profileData.mainPhoto,
                gallery: profileData.gallery,
                birthDay: profileData.birthDay,
                birthMonth: profileData.birthMonth,
                birthYear: profileData.birthYear,
                deathDay: profileData.deathDay,
                deathMonth: profileData.deathMonth,
                deathYear: profileData.deathYear,
                youtubeVideoUrl: profileData.youtubeVideoUrl,
                paid: false,
                orderId,
            });
        }
        await draft.save();

        // Создание платежа
        const payment = new Payment({
            orderId,
            amount,
            currency,
            description,
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
        console.error('Error creating payment:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при создании платежа', error: error.message });
    }
};

// Обработка коллбека от LiqPay
exports.handleCallback = async (req, res) => {
    try {
        console.log('LiqPay callback received:', req.body);
        const { data, signature } = req.body;

        const generatedSignature = crypto
            .createHash('sha1')
            .update(privateKey + data + privateKey)
            .digest('base64');
        if (signature !== generatedSignature) {
            console.error('Invalid signature');
            return res.status(400).json({ message: 'Недействительная подпись' });
        }

        const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));

        const payment = await Payment.findOne({ orderId: decodedData.order_id });
        if (!payment) {
            console.error('Payment not found:', decodedData.order_id);
            return res.status(404).json({ message: 'Платеж не найден' });
        }

        payment.status = decodedData.status;
        payment.liqpayOrderId = decodedData.payment_id;
        await payment.save();

        // Обновление статуса черновика, если платеж успешен
        if (['success', 'subscribed'].includes(decodedData.status)) {
            const draft = await Draft.findOne({ orderId: decodedData.order_id });
            if (draft) {
                draft.paid = true;
                await draft.save();
                console.log(`Черновик обновлен до paid=true для orderId: ${decodedData.order_id}`);
            } else {
                console.error(`Черновик не найден для orderId: ${decodedData.order_id}`);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error in callback:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка в callback' });
    }
};

// Проверка статуса черновика и обновление
exports.checkProfileStatus = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'orderId обязателен' });
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ message: 'Платеж не найден' });
        }

        const draft = await Draft.findOne({ orderId });
        if (!draft) {
            return res.status(404).json({ message: 'Черновик не найден' });
        }

        // Если платеж успешен, обновляем статус черновика
        if (['success', 'subscribed'].includes(payment.status) && !draft.paid) {
            draft.paid = true;
            await draft.save();
            console.log(`Черновик обновлен до paid=true для orderId: ${orderId}`);
        }

        res.json({ draft, paymentStatus: payment.status });
    } catch (error) {
        console.error('Error checking profile status:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при проверке статуса черновика', error: error.message });
    }
};