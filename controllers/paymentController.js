// paymentController.js
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

// Создание платежа и профиля
exports.createPayment = async (req, res) => {
    try {
        const { amount, currency, description, profileData } = req.body;

        // Проверка обязательных полей
        if (!amount || !currency || !description || !profileData.email || !profileData.name) {
            return res.status(400).json({ message: 'Отсутствуют обязательные поля: amount, currency, description, email или name' });
        }

        const orderId = `order_${uuidv4()}`;

        // Проверка, существует ли профиль с таким email
        let draft = await Draft.findOne({ email: profileData.email, paid: false });
        if (!draft) {
            // Создание нового профиля
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
        } else {
            // Обновление orderId для существующего неоплаченного профиля
            draft.orderId = orderId;
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
        const { data, signature } = req.body;

        // 1. Верификация подписи (добавьте логирование)
        console.log('Received callback:', { data, signature });

        const computedSignature = crypto
            .createHash('sha1')
            .update(privateKey + data + privateKey)
            .digest('base64');

        if (signature !== computedSignature) {
            console.error('Invalid signature', { received: signature, computed: computedSignature });
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // 2. Парсинг данных (добавьте подробное логирование)
        const decoded = JSON.parse(Buffer.from(data, 'base64').toString());
        console.log('Decoded callback data:', JSON.stringify(decoded, null, 2));

        // 3. Поиск и обновление платежа
        const payment = await Payment.findOneAndUpdate(
            { orderId: decoded.order_id },
            {
                status: decoded.status,
                liqpayOrderId: decoded.liqpay_order_id || decoded.payment_id,
                lastCallback: new Date()
            },
            { new: true }
        );

        console.log('Updated payment:', payment);

        if (!payment) {
            console.error('Payment not found for order:', decoded.order_id);
            return res.status(404).json({ message: 'Payment not found' });
        }

        // 4. Обновление черновика
        if (['success', 'subscribed'].includes(decoded.status)) {
            const updatedDraft = await Draft.findByIdAndUpdate(
                payment.draftId,
                {
                    paid: true,
                    paymentDate: new Date(),
                    status: 'active'
                },
                { new: true }
            );
            console.log('Updated draft:', updatedDraft);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Callback processing error:', error);
        res.status(500).json({ message: 'Callback processing failed' });
    }
};

// Проверка статуса профиля и обновление
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
            return res.status(404).json({ message: 'Профиль не найден' });
        }

        // Если платеж успешен, обновляем статус профиля
        if (['success', 'subscribed'].includes(payment.status) && !draft.paid) {
            draft.paid = true;
            await draft.save();
            console.log(`Профиль обновлен до paid=true для orderId: ${orderId}`);
        }

        res.json({ profile: draft, paymentStatus: payment.status });
    } catch (error) {
        console.error('Error checking profile status:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при проверке статуса профиля', error: error.message });
    }
};