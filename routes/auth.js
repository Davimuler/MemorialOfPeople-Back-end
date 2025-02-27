const express = require('express');
const router = express.Router();
const { registerUser, authUser ,googleLogin,getUserByEmail,changePassword,deleteAccount} = require('../controllers/authController');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);

router.post('/login', authUser);
router.post('/google', googleLogin);
router.post('/getuser', getUserByEmail);
router.post('/update-referral-code', authController.updateReferralCode);
// router.put('/change-password', protect, changePassword);
//router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
