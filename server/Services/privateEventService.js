// services/privateEventService.js
const PrivateEvent = require("../models/PrivateEvent");
const User = require("../models/user");
const crypto = require("crypto");

const privateEventService = {
  getAllPrivateEvents: async () => {
    const events = await PrivateEvent.find();
    console.log("Fetched all private events:", events);
    return events.map((event) => ({
      ...event.toObject(),
      id: event._id.toString(),
    }));
  },

  getPrivateEventsByUser: async (username) => {
    try {
      const events = await PrivateEvent.find({ username });
      return events.map((event) => ({
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      }));
    } catch (error) {
      console.error("Error fetching events by user:", error.message);
      throw new Error("Error fetching events: " + error.message);
    }
  },

  getPrivateEventById: async (eventId) => {
    try {
      const event = await PrivateEvent.findOne({ _id: eventId });
      if (!event) throw new Error("Event not found");
      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      };
    } catch (error) {
      console.error("Error fetching event by ID:", error.message);
      throw new Error("Error fetching event: " + error.message);
    }
  },

  createPrivateEvent: async (eventData) => {
    try {
      const participants = [
        eventData.username,
        ...(eventData.participants || []).filter(
          (p) => p !== eventData.username
        ),
      ];

      const newEvent = new PrivateEvent({
        ...eventData,
        participants,
        joinRequests: eventData.joinRequests || [],
        accessUrl: "", // Set temporarily, update after save
      });

      const savedEvent = await newEvent.save();

      // Update accessUrl with the saved event's ID
      savedEvent.accessUrl = `https://localhost:5173/smashpadelcenter/privat-turnering/${eventData.username}/${savedEvent._id}`;
      await savedEvent.save();

      await User.updateMany(
        { username: { $in: participants } },
        { $push: { eventHistory: savedEvent._id } }
      );

      return {
        ...savedEvent.toObject(),
        id: savedEvent._id.toString(),
      };
    } catch (error) {
      console.error("Error creating event:", error.message);
      throw new Error("Error creating event: " + error.message);
    }
  },

  updatePrivateEvent: async (eventId, updateData = null) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");

      Object.assign(event, updateData);
      const updatedEvent = await event.save();

      return {
        ...updatedEvent.toObject(),
        id: updatedEvent._id.toString(),
        participants: updatedEvent.participants || [],
        joinRequests: updatedEvent.joinRequests || [],
      };
    } catch (error) {
      console.error("Error updating event:", error.message);
      throw new Error("Error updating event: " + error.message);
    }
  },

  joinPrivateEvent: async (eventId, username) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");

      if (
        event.participants.includes(username) ||
        event.joinRequests.includes(username)
      ) {
        throw new Error("User already in participants or join requests");
      }
      if (event.participants.length >= event.totalSpots) {
        throw new Error("Event is full");
      }
      event.joinRequests.push(username);
      await event.save();

      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      };
    } catch (error) {
      console.error("Error joining event:", error.message);
      throw new Error("Error joining event: " + error.message);
    }
  },

  confirmJoinPrivateEvent: async (eventId, username) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");

      if (!event.joinRequests.includes(username)) {
        throw new Error("No join request found for this user");
      }
      if (event.participants.length >= event.totalSpots) {
        throw new Error("Event is full");
      }
      event.joinRequests = event.joinRequests.filter((req) => req !== username);
      event.participants.push(username);
      await event.save();

      await User.updateOne(
        { username },
        { $push: { eventHistory: event._id } }
      );

      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      };
    } catch (error) {
      console.error("Error confirming join:", error.message);
      throw new Error("Error confirming join: " + error.message);
    }
  },

  deletePrivateEvent: async (eventId) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");

      await User.updateMany(
        { username: { $in: event.participants } },
        { $pull: { eventHistory: event._id } }
      );

      await PrivateEvent.findByIdAndDelete(eventId);
      const events = await PrivateEvent.find();
      return events.map((event) => ({
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      }));
    } catch (error) {
      console.error("Error deleting event:", error.message);
      throw new Error("Error deleting event: " + error.message);
    }
  },
};

module.exports = privateEventService;
