const express = require('express');
const Monument = require('../models/Monument');
const router = express.Router();

// Получить все памятники
router.get('/', async (req, res) => {
    try {
        const monuments = await Monument.find();
        res.json(monuments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Получить памятники по секции
router.get('/section/:section', async (req, res) => {
    try {
        const monuments = await Monument.find({ section: req.params.section });
        res.json(monuments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Создать новую карточку
router.post('/', async (req, res) => {
    const monument = new Monument({
        imgSrc: req.body.imgSrc,
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        section: req.body.section,
        creatorEmail: req.body.creatorEmail,
        country: req.body.country, // Добавлено поле country
        city: req.body.city        // Добавлено поле city
    });

    try {
        const newMonument = await monument.save();
        res.status(201).json(newMonument);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Редактировать карточку
router.patch('/:id', async (req, res) => {
    try {
        const monument = await Monument.findById(req.params.id);
        if (!monument) return res.status(404).json({ message: 'Monument not found' });

        if (req.body.imgSrc) monument.imgSrc = req.body.imgSrc;
        if (req.body.title) monument.title = req.body.title;
        if (req.body.description) monument.description = req.body.description;
        if (req.body.price) monument.price = req.body.price;
        if (req.body.section) monument.section = req.body.section;
        if (req.body.country) monument.country = req.body.country; // Обновление страны
        if (req.body.city) monument.city = req.body.city;           // Обновление города

        const updatedMonument = await monument.save();
        res.json(updatedMonument);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Удалить карточку
router.delete('/:id', async (req, res) => {
    try {
        const monument = await Monument.findById(req.params.id);
        if (!monument) return res.status(404).json({ message: 'Monument not found' });

        await monument.deleteOne(); // Используем deleteOne вместо remove
        res.json({ message: 'Monument deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Получить все карточки по почте создателя
router.get('/creator/:email', async (req, res) => {
    try {
        const monuments = await Monument.find({ creatorEmail: req.params.email });
        res.json(monuments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;