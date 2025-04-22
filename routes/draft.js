const express = require("express");
const router = express.Router();
const draftController = require("../controllers/draftController");
const adminController = require("../controllers/adminController");

// Сохранение черновика
router.post('/', draftController.saveDraft);

// Обновление статуса оплаты черновика
router.put('/:draftId/payment', draftController.updateDraftPaymentStatus);

// Получение черновиков по email
router.get('/email/:email', draftController.getDraftsByEmail);

// Получение черновика по ID
router.get('/:draftId', draftController.getDraftById);

// Обновление черновика
router.put('/:draftId', draftController.updateDraft);

// Поиск черновиков по имени
router.get('/search/:email?', draftController.searchDraftsByName);

// Получение черновиков с пагинацией
router.get('/paginated', draftController.getDraftsPaginated);

// Добавление бесплатных профилей
router.post('/add-free-profiles', adminController.addFreeProfiles);

// Получение информации о бесплатных профилях пользователя
router.get('/free-profiles/:email', adminController.getUserFreeProfiles);

module.exports = router;