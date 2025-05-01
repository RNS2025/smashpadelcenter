const Feedback = require('../models/Feedback');
const Briefing = require("../models/Briefing");

const FeedbackService = {
    createFeedback: async (feedbackData) => {
        try {
            const newFeedback = new Feedback(feedbackData);
            await newFeedback.save();
            return newFeedback;
        } catch (error) {
            throw new Error('Error creating feedback: ' + error.message);
        }
    },

    getAllFeedbacks: async () => {
        try {
            return await Feedback.find();
        } catch (error) {
            throw new Error('Error fetching feedbacks: ' + error.message);
        }
    },

    resolveFeedback: async (id, resolved) => {
        try {
            return await Feedback.findByIdAndUpdate(id, {resolved}, {new: true});
        } catch (error) {
            throw new Error('Error resolving feedback: ' + error.message);
        }
    },

}

module.exports = FeedbackService;