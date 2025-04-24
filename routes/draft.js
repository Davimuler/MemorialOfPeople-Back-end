const express = require("express");
const router = express.Router();
const draftController = require("../controllers/draftController");
const adminController = require("../controllers/adminController");

// Операции с черновиками
router.post('/', draftController.saveDraft);
router.put('/:draftId([0-9a-fA-F]{24})/payment', draftController.updateDraftPaymentStatus);
router.put('/:draftId([0-9a-fA-F]{24})', draftController.updateDraft);

// Получение данных о черновиках
router.get('/email/:email', draftController.getDraftsByEmail);
router.get('/search', draftController.searchDraftsByName);
router.get('/paginated', draftController.getDraftsPaginated);

// Получение черновика по ID
router.get('/:draftId([0-9a-fA-F]{24})', draftController.getDraftById);

// Админские операции
router.post('/add-free-profiles', adminController.addFreeProfiles);
router.get('/free-profiles/:email', adminController.getUserFreeProfiles);

module.exports = router;