// services/privateEventService.js
const PrivateEvent = require("../models/PrivateEvent");
const User = require("../models/user");
const crypto = require("crypto");
const logger = require("../config/logger");

const privateEventService = {
  getAllPrivateEvents: async () => {
    try {
      const events = await PrivateEvent.find();
      logger.info("PrivateEventService: Fetched all private events", {
        count: events.length,
      });
      return events.map((event) => ({
        ...event.toObject(),
        id: event._id.toString(),
      }));
    } catch (error) {
      logger.error("PrivateEventService: Error fetching events", {
        error: error.message,
      });
      throw error;
    }
  },

  removePlayerFromEvent: async (eventId, username) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");
      if (!event.participants.includes(username)) {
        throw new Error("User is not a participant of this event");
      }
      if (!event.invitedPlayers.includes(username)) {
        throw new Error("User is not invited to this event");
      }
      if (!event.joinRequests.includes(username)) {
        throw new Error("User has not requested to join this event");
      }
      // Remove user from participants and invitedPlayers list
      event.invitedPlayers = event.invitedPlayers.filter((u) => u !== username);
      event.participants = event.participants.filter((u) => u !== username);
      event.joinRequests = event.joinRequests.filter((u) => u !== username);
      await event.save();
      await User.updateOne(
        { username },
        { $pull: { eventHistory: event._id } }
      );
      logger.info("PrivateEventService: Removed user from event", {
        eventId,
        username,
      });
      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      };
    } catch (error) {
      logger.error("PrivateEventService: Error removing user from event", {
        eventId,
        username,
        error: error.message,
      });
      throw new Error("Error removing user from event: " + error.message);
    }
  },

  confirmAcceptPrivateEvent: async (eventId, username) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");

      if (!event.invitedPlayers.includes(username)) {
        throw new Error("User is not invited to this event");
      }

      // Remove user from invitedPlayers list and add to participants
      event.invitedPlayers = event.invitedPlayers.filter((u) => u !== username);
      event.participants.push(username);

      await event.save();

      // Update user's event history
      await User.updateOne(
        { username },
        { $push: { eventHistory: event._id } }
      );

      logger.info("PrivateEventService: User accepted event invitation", {
        eventId,
        username,
      });

      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
        invitedPlayers: event.invitedPlayers || [],
      };
    } catch (error) {
      logger.error("PrivateEventService: Error accepting event invitation", {
        eventId,
        username,
        error: error.message,
      });
      throw new Error("Error accepting invitation: " + error.message);
    }
  },

  confirmDeclinePrivateEvent: async (eventId, username) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");

      if (!event.invitedPlayers.includes(username)) {
        throw new Error("User is not invited to this event");
      }

      // Remove user from invitedPlayers list
      event.invitedPlayers = event.invitedPlayers.filter((u) => u !== username);
      await event.save();

      logger.info("PrivateEventService: User declined event invitation", {
        eventId,
        username,
      });

      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
        invitedPlayers: event.invitedPlayers || [],
      };
    } catch (error) {
      logger.error("PrivateEventService: Error declining event invitation", {
        eventId,
        username,
        error: error.message,
      });
      throw new Error("Error declining invitation: " + error.message);
    }
  },

  getPrivateEventsByUser: async (username) => {
    try {
      const events = await PrivateEvent.find({ username });
      logger.info("PrivateEventService: Fetched events by user", {
        username,
        count: events.length,
      });
      return events.map((event) => ({
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      }));
    } catch (error) {
      logger.error("PrivateEventService: Error fetching events by user", {
        username,
        error: error.message,
      });
      throw new Error("Error fetching events: " + error.message);
    }
  },

  getPrivateEventById: async (eventId) => {
    try {
      const event = await PrivateEvent.findOne({ _id: eventId });
      if (!event) throw new Error("Event not found");
      logger.info("PrivateEventService: Fetched event by ID", { eventId });
      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      };
    } catch (error) {
      logger.error("PrivateEventService: Error fetching event by ID", {
        eventId,
        error: error.message,
      });
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

      logger.info("PrivateEventService: Created new private event", {
        eventId: savedEvent._id,
      });
      return {
        ...savedEvent.toObject(),
        id: savedEvent._id.toString(),
      };
    } catch (error) {
      logger.error("PrivateEventService: Error creating event", {
        error: error.message,
      });
      throw new Error("Error creating event: " + error.message);
    }
  },

  invitedPlayers: async (eventId, usernames) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");

      // Validate usernames (ensure they exist in the User collection)
      const validUsers = await User.find({ username: { $in: usernames } });
      const validUsernames = validUsers.map((user) => user.username);
      const invalidUsernames = usernames.filter(
        (username) => !validUsernames.includes(username)
      );
      if (invalidUsernames.length > 0) {
        throw new Error(`Invalid usernames: ${invalidUsernames.join(", ")}`);
      }

      // Filter out usernames already in participants or invitedPlayers
      const newInviteRequests = validUsernames.filter(
        (username) =>
          !event.participants.includes(username) &&
          !event.invitedPlayers.includes(username)
      );

      event.invitedPlayers.push(...newInviteRequests);
      await event.save();
      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
        invitedPlayers: event.invitedPlayers || [],
      };
    } catch (error) {
      logger.error("PrivateEventService: Error inviting players", {
        eventId,
        usernames,
        error: error.message,
      });
      throw new Error("Error inviting players: " + error.message);
    }
  },

  updatePrivateEvent: async (eventId, updateData = null) => {
    try {
      const event = await PrivateEvent.findById(eventId);
      if (!event) throw new Error("Event not found");

      Object.assign(event, updateData);
      const updatedEvent = await event.save();

      logger.info("PrivateEventService: Updated private event", { eventId });
      return {
        ...updatedEvent.toObject(),
        id: updatedEvent._id.toString(),
        participants: updatedEvent.participants || [],
        joinRequests: updatedEvent.joinRequests || [],
      };
    } catch (error) {
      logger.error("PrivateEventService: Error updating event", {
        eventId,
        error: error.message,
      });
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

      logger.info("PrivateEventService: User requested to join event", {
        eventId,
        username,
      });
      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      };
    } catch (error) {
      logger.error("PrivateEventService: Error joining event", {
        eventId,
        username,
        error: error.message,
      });
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

      logger.info("PrivateEventService: User confirmed to join event", {
        eventId,
        username,
      });
      return {
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      };
    } catch (error) {
      logger.error("PrivateEventService: Error confirming join", {
        eventId,
        username,
        error: error.message,
      });
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

      logger.info("PrivateEventService: Deleted private event", { eventId });
      return events.map((event) => ({
        ...event.toObject(),
        id: event._id.toString(),
        participants: event.participants || [],
        joinRequests: event.joinRequests || [],
      }));
    } catch (error) {
      logger.error("PrivateEventService: Error deleting event", {
        eventId,
        error: error.message,
      });
      throw new Error("Error deleting event: " + error.message);
    }
  },
};

module.exports = privateEventService;
