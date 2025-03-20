const express = require("express");
const router = express.Router();
const draftController = require("../controllers/draftController");

// Сохранение черновика
router.post("/draft", draftController.saveDraft);
router.get("/email/:email", draftController.getDraftsByEmail);
router.put("/:draftId/paid", draftController.updateDraftPaymentStatus);
router.get("/id/:draftId", draftController.getDraftById);
router.put("/update/:draftId", draftController.updateDraft);


module.exports = router;