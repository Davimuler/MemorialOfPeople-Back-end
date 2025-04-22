const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    freeProfilesAvailable: { type: Number, default: 0 }, // Количество доступных бесплатных профилей
    freeProfilesUsed: { type: Number, default: 0 },
    email: { type: String, required: true, unique: true },
    displayName: { type: String },
    phoneNumber: { type: String },
    password: { type: String },
    uid: { type: String, unique: true },
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    referralCode: { type: String, default: '' },
    referralCount: { type: Number, default: 0 },
    userStatus: {
        type: String,
        enum: ['user', 'partner', 'agent','admin'],
        default: 'user'
    },
    paymentHistory: [{
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'completed', 'failed'], required: true }
    }],
    createdProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }], // Ссылки на созданные профили
    isDiscount: { type: Boolean, default: false } // Новая булевая переменная
});

// Хэширование пароля только для локальных пользователей
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.provider !== 'local') {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;