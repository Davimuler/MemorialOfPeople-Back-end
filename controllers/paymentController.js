const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payments');
const Draft = require('../models/Draft');

const publicKey = process.env.LIQPAY_PUBLIC_KEY;
const privateKey = process.env.LIQPAY_PRIVATE_KEY;

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
        const { amount, currency, description, draftId, lang } = req.body;

        // 1. Валидация входящих данных
        if (!amount || !currency || !description || !draftId) {
            return res.status(400).json({
                message: 'Missing required fields: amount, currency, description, draftId'
            });
        }

        // 2. Валидация языка
        const supportedLanguages = ['ua', 'eng', 'ro', 'de', 'pl', 'it', 'fr', 'es', 'cs', 'sk'];
        const redirectLang = supportedLanguages.includes(lang) ? lang : 'ua'; // По умолчанию 'ua'
        console.log('Received lang:', lang, 'Using redirectLang:', redirectLang);

        // 3. Поиск черновика
        const draft = await Draft.findById(draftId);
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }

        // 4. Проверка статуса черновика
        if (draft.paid) {
            return res.status(400).json({ message: 'This draft has already been paid' });
        }

        // 5. Генерация уникального orderId
        let orderId;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 5) {
            orderId = `order_${uuidv4()}`;
            const exists = await Payment.exists({ orderId });
            if (!exists) isUnique = true;
            attempts++;
        }

        if (!isUnique) {
            throw new Error('Failed to generate unique orderId');
        }

        // 6. Обновление черновика
        draft.orderId = orderId;
        await draft.save();

        // 7. Создание записи о платеже
        const payment = new Payment({
            payment_id: `payment_${uuidv4()}`, // Generate a unique payment_id
            orderId,
            amount,
            currency,
            description: `${description} - ${draft.name}`,
            status: 'pending',
            draftId: draft._id
        });
        await payment.save();

        // 8. Подготовка данных для LiqPay
        const params = {
            public_key: publicKey,
            version: '3',
            action: 'pay',
            amount,
            currency,
            description: `Payment for ${draft.name}`,
            order_id: orderId,
            language: 'uk',
            server_url: `${process.env.API_BASE_URL}/api/payment/callback`,
            result_url: `${process.env.CLIENT_URL}/${redirectLang}/dashboard`, // Используем язык в URL
        };

        console.log('LiqPay params:', params);

        const { data, signature } = generateLiqPayData(params);

        res.json({
            success: true,
            data,
            signature,
            orderId
        });

    } catch (error) {
        console.error('[Payment Error]', error);
        res.status(500).json({
            success: false,
            message: 'Payment creation failed',
            error: error.message
        });
    }
};

// Оптимизированный обработчик коллбэка
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

        console.log('Checking status for orderId:', orderId);

        if (!orderId) {
            console.log('orderId is missing');
            return res.status(400).json({ message: 'orderId обязателен' });
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            console.log('Payment not found for orderId:', orderId);
            return res.status(404).json({ message: 'Платеж не найден' });
        }
        console.log('Found payment:', payment);

        const draft = await Draft.findOne({ orderId });
        if (!draft) {
            console.log('Draft not found for orderId:', orderId);
            return res.status(404).json({ message: 'Черновик не найден' });
        }
        console.log('Found draft:', draft);

        if (['success', 'subscribed'].includes(payment.status) && !draft.paid) {
            draft.paid = true;
            await draft.save();
            console.log(`Draft updated to paid=true for orderId: ${orderId}`);
        } else {
            console.log(`No update needed for draft. Payment status: ${payment.status}, Draft paid: ${draft.paid}`);
        }

        res.json({ draft, paymentStatus: payment.status });
    } catch (error) {
        console.error('Error checking profile status:', error.message, error.stack);
        res.status(500).json({ message: 'Ошибка при проверке статуса черновика', error: error.message });
    }
};