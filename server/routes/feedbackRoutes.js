const express = require('express');
const router = express.Router();
const feedbackService = require('../Services/feedbackService');

// POST /api/v1/feedback
router.post('/', async (req, res) => {
    try {
        const newFeedback = await feedbackService.createFeedback(req.body);
        res.status(201).json(newFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/v1/feedback
router.get('/', async (req, res) => {
    try {
        const feedbacks = await feedbackService.getAllFeedbacks();
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/v1/feedback/:id
router.put('/resolve/:id', async (req, res) => {
    try {
        const { resolved } = req.body;
        const updatedFeedback = await feedbackService.resolveFeedback(req.params.id, resolved);
        if (!updatedFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.status(200).json(updatedFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



module.exports = router;