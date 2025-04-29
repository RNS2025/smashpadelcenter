const Briefing = require('../models/Briefing');

const BriefingService = {
    createBriefing : async (briefingData) => {
        try {
            const newBriefing = new Briefing(briefingData);
            await newBriefing.save();
            return newBriefing;
        } catch (error) {
            throw new Error('Error creating briefing: ' + error.message);
        }
    },

    getAllBriefings : async () => {
        try {
            return await Briefing.find();
        } catch (error) {
            throw new Error('Error fetching briefings: ' + error.message);
        }
    },

    getBriefingById : async (id) => {
        try {
            return await Briefing.findById(id);
        } catch (error) {
            throw new Error('Error fetching briefing: ' + error.message);
        }
    },

    deleteBriefing : async (id) => {
        try {
            return await Briefing.findByIdAndDelete(id);
        } catch (error) {
            throw new Error('Error deleting briefing: ' + error.message);
        }
    },

    updateBriefing : async (id, briefingData) => {
        try {
            return await Briefing.findByIdAndUpdate(id, briefingData, {new: true});
        } catch (error) {
            throw new Error('Error updating briefing: ' + error.message);
        }
    },

}

module.exports = BriefingService;