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

// Создание платежа (обновлённая версия)
exports.createPayment = async (req, res) => {
    try {
        const { amount, currency, description, draftId } = req.body;

        // 1. Валидация входящих данных
        if (!amount || !currency || !description || !draftId) {
            return res.status(400).json({
                message: 'Missing required fields: amount, currency, description, draftId'
            });
        }

        // 2. Поиск черновика
        const draft = await Draft.findById(draftId);
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }

        // 3. Проверка статуса черновика
        if (draft.paid) {
            return res.status(400).json({ message: 'This draft has already been paid' });
        }

        // 4. Генерация уникального orderId
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

        // 5. Обновление черновика
        draft.orderId = orderId;
        await draft.save();

        // 6. Создание записи о платеже
        const payment = new Payment({
            orderId,
            amount,
            currency,
            description: `${description} - ${draft.name}`,
            status: 'pending',
            draftId: draft._id,
            payment_id: orderId
        });
        await payment.save();

        // 7. Подготовка данных для LiqPay
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
            result_url: `${process.env.CLIENT_URL}/payment-success?orderId=${orderId}`,
        };

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
        console.log('[Raw Callback Body]', req.body);

        const { data, signature } = req.body;

        if (!data || !signature) {
            console.error('[Missing Data] No data or signature in callback');
            return res.status(400).json({ message: 'Missing data or signature' });
        }

        // Верификация подписи
        const computedSignature = crypto
            .createHash('sha1')
            .update(privateKey + data + privateKey)
            .digest('base64');

        if (signature !== computedSignature) {
            console.error('[Invalid Signature]', {
                received: signature,
                computed: computedSignature,
                privateKey: privateKey ? 'present' : 'missing'
            });
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Парсинг данных
        let decoded;
        try {
            decoded = JSON.parse(Buffer.from(data, 'base64').toString());
            console.log('[Decoded Callback Data]', decoded);
        } catch (parseError) {
            console.error('[Parse Error] Failed to parse callback data:', parseError);
            return res.status(400).json({ message: 'Invalid data format' });
        }

        if (!decoded.order_id) {
            console.error('[Missing Order ID] No order_id in callback data');
            return res.status(400).json({ message: 'Missing order_id' });
        }

        // Поиск платежа
        const payment = await Payment.findOne({ orderId: decoded.order_id });
        if (!payment) {
            console.error('[Payment Not Found] for orderId:', decoded.order_id);
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Обновление платежа
        const updatedPayment = await Payment.findOneAndUpdate(
            { _id: payment._id },
            {
                status: decoded.status,
                liqpayOrderId: decoded.liqpay_order_id || decoded.payment_id || decoded.liqpayOrderId,
                lastCallback: new Date(),
                rawCallback: decoded // сохраняем полные данные callback для отладки
            },
            { new: true }
        );

        console.log('[Updated Payment]', updatedPayment);

        // Обновление черновика при успешной оплате
        if (['success', 'sandbox', 'subscribed'].includes(decoded.status.toLowerCase())) {
            const updatedDraft = await Draft.findByIdAndUpdate(
                payment.draftId,
                {
                    paid: true,
                    paymentDate: new Date(),
                    $setOnInsert: { orderId: payment.orderId } // на случай если draft не был обновлен ранее
                },
                { new: true }
            );

            if (!updatedDraft) {
                console.error('[Draft Update Failed] Draft not found:', payment.draftId);
            } else {
                console.log('[Updated Draft] Marked as paid:', updatedDraft._id);
            }
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('[Callback Processing Error]', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(500).json({
            message: 'Callback processing failed',
            error: error.message
        });
    }
};


// Проверка статуса (оптимизированная)
exports.checkStatus = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'orderId is required' });
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        const draft = await Draft.findById(payment.draftId);
        if (!draft) {
            return res.status(404).json({ message: 'Draft not found' });
        }

        res.json({
            paymentStatus: payment.status,
            draftStatus: draft.paid,
            lastUpdated: payment.updatedAt
        });

    } catch (error) {
        console.error('[Status Check Error]', error);
        res.status(500).json({ message: 'Status check failed' });
    }
};