const User = require('../models/User');
const jwt = require('jsonwebtoken');

// User registration
const registerUser = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // New user creation
        const user = new User({ firstName, lastName, email, phoneNumber, password });
        await user.save();

        //  JWT token creation
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.status(201).json({
            token,
            user: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// User log in
const authUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Wrong input data' });
        }

        const isPasswordMatch = await user.matchPassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Wrong input data' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d',
        });

        res.json({
            token,
            user: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, authUser };
