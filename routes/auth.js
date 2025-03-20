const express = require('express');
const router = express.Router();
const { becomePartner,updateDiscountStatus, incrementReferralCountByCode, incrementReferralCount, registerUser,updateReferralCode, authUser ,googleLogin,getUserByEmail,changePassword,deleteAccount} = require('../controllers/authController');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);

router.post('/login', authUser);
router.post('/google', googleLogin);
router.post('/getuser', getUserByEmail);
//router.post('/update-referral-code', authController.updateReferralCode);
// router.put('/change-password', protect, changePassword);
//router.delete('/delete-account', protect, deleteAccount);
router.put('/updateReferralCode',updateReferralCode)
router.put('/updateReferralCount',incrementReferralCount)
router.post('/incrementReferral', incrementReferralCountByCode);
router.put('/updateDiscountStatus', updateDiscountStatus);
router.put('/becomePartner', becomePartner);

module.exports = router;
