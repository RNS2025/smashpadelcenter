const express = require('express');
const router = express.Router();
const briefingService = require('../Services/briefingService');
const briefing = require('../models/Briefing');

// POST /api/v1/briefing
router.post('/', async (req, res) => {
    try {
        const newBriefing = await briefingService.createBriefing(req.body);
        res.status(201).json(newBriefing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/v1/briefing
router.get('/', async (req, res) => {
    try {
        const briefings = await briefingService.getAllBriefings();
        res.status(200).json(briefings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/v1/briefing/:id
router.get('/:id', async (req, res) => {
    try {
        const briefingId = req.params.id;
        const briefingData = await briefingService.getBriefingById(briefingId);
        if (!briefingData) {
            return res.status(404).json({ message: 'Briefing not found' });
        }
        res.status(200).json(briefingData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/v1/briefing/:id
router.delete('/:id', async (req, res) => {
    try {
        const briefingId = req.params.id;
        const deletedBriefing = await briefingService.deleteBriefing(briefingId);
        if (!deletedBriefing) {
            return res.status(404).json({ message: 'Briefing not found' });
        }
        res.status(200).json({ message: 'Briefing deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/v1/briefing/:id
router.put('/:id', async (req, res) => {
    try {
        const briefingId = req.params.id;
        const updatedBriefing = await briefingService.updateBriefing(briefingId, req.body);
        if (!updatedBriefing) {
            return res.status(404).json({ message: 'Briefing not found' });
        }
        res.status(200).json(updatedBriefing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;