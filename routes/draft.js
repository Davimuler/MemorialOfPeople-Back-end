const express = require("express");
const router = express.Router();
const draftController = require("../controllers/draftController");

// Сохранение черновика
router.post('/', draftController.saveDraft);
router.put('/:draftId/payment', draftController.updateDraftPaymentStatus);
router.get('/email/:email', draftController.getDraftsByEmail);
router.get('/:draftId', draftController.getDraftById);
router.put('/:draftId', draftController.updateDraft);
router.get('/search/:email?', draftController.searchDraftsByName);
router.get('/paginated', draftController.getDraftsPaginated);


module.exports = router;