const { Server } = require("socket.io");
const User = require("./models/user");
const Friend = require("./models/Friend");
const Message = require("./models/Message");
const {
  getAllTrainerMessages,
  getTrainerByUsername,
  getTrainerMessages,
  sendTrainerMessage,
  bookTrainer,
  getUserBookings,
  addTrainerAvailability,
  removeTrainerAvailability,
  getAllTrainers,
  createTrainer,
} = require("./Services/trainerService");

// Track online users
const onlineUsers = new Map();

function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://localhost:5173",
        "https://rns2025.github.io",
      ], // Frontend URL
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Handle user joining with their username
    socket.on("join", async (username) => {
      try {
        if (!username || typeof username !== "string") {
          console.error(`Invalid username received in join event: ${username}`);
          return;
        }

        const user = await User.findOne({ username });
        if (!user) {
          console.error(`User not found for username: ${username}`);
          return;
        }
        const userId = user._id.toString();

        socket.join(userId);
        socket.join(`user_${username}`); // Join username-based room for trainer operations
        onlineUsers.set(username, socket.id);

        // Notify friends of online status
        const friends = await Friend.find({
          $or: [{ userId }, { friendId: userId }],
          status: "accepted",
        });

        friends.forEach((friend) => {
          const friendId =
            friend.userId.toString() === userId
              ? friend.friendId.toString()
              : friend.userId.toString();
          io.to(friendId).emit("userStatus", { userId, status: "online" });
        });

        // If user is a trainer, join their trainer room
        const trainer = await getTrainerByUsername(username);
        if (trainer) {
          socket.join(`trainer_${username}`);
          socket.join(`trainer_${username}_user`);
        }
      } catch (error) {
        console.error("Error in join event:", error);
      }
    });
    // Handle fetching all trainers
    socket.on("fetchTrainers", async () => {
      try {
        const trainers = await getAllTrainers();
        socket.emit("trainersData", trainers);
      } catch (error) {
        console.error("Error fetching trainers:", error);
        socket.emit("error", { message: "Failed to fetch trainers" });
      }
    });

    // Handle fetching trainer messages for a user
    socket.on("fetchTrainerMessages", async ({ username, trainerUsername }) => {
      try {
        const messages = await getTrainerMessages(username, trainerUsername);
        socket.emit("trainerMessagesData", messages);
      } catch (error) {
        console.error("Error fetching trainer messages:", error);
        socket.emit("error", { message: "Failed to fetch messages" });
      }
    });

    // Handle sending trainer messages
    socket.on(
      "sendTrainerMessage",
      async ({ senderUsername, trainerUsername, content }) => {
        try {
          const trainer = await getTrainerByUsername(trainerUsername);
          if (!trainer) {
            socket.emit("error", { message: "Trainer not found" });
            return;
          }
          const message = await sendTrainerMessage(
            senderUsername,
            trainerUsername,
            content
          );
          // Emit to both trainer and user rooms
          io.to(`trainer_${trainerUsername}`).emit(
            "newTrainerMessage",
            message
          );
          io.to(`user_${senderUsername}`).emit("newTrainerMessage", message);
        } catch (error) {
          console.error("Error sending trainer message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Handle trainer booking
    socket.on(
      "bookTrainer",
      async ({ username, trainerUsername, date, timeSlot }) => {
        try {
          const trainer = await getTrainerByUsername(trainerUsername);
          if (!trainer) {
            socket.emit("error", { message: "Trainer not found" });
            return;
          }
          const booking = await bookTrainer(
            username,
            trainerUsername,
            date,
            timeSlot
          );
          // Emit to trainer and user rooms
          io.to(`trainer_${trainerUsername}`).emit("newBooking", booking);
          io.to(`user_${username}`).emit("newBooking", booking);
        } catch (error) {
          console.error("Error booking trainer:", error);
          socket.emit("error", { message: "Failed to book trainer" });
        }
      }
    );

    // Handle adding trainer availability
    socket.on("addTrainerAvailability", async ({ username, availability }) => {
      try {
        const trainer = await getTrainerByUsername(username);
        if (!trainer) {
          socket.emit("error", { message: "Trainer not found" });
          return;
        }
        const updatedTrainer = await addTrainerAvailability(
          username,
          availability
        );
        // Emit updated availability to trainer room
        io.to(`trainer_${username}`).emit(
          "updatedAvailability",
          updatedTrainer.availability
        );
      } catch (error) {
        console.error("Error adding trainer availability:", error);
        socket.emit("error", { message: "Failed to add availability" });
      }
    });

    // Handle removing trainer availability
    socket.on("removeTrainerAvailability", async ({ username, date }) => {
      try {
        const trainer = await getTrainerByUsername(username);
        if (!trainer) {
          socket.emit("error", { message: "Trainer not found" });
          return;
        }
        const updatedTrainer = await removeTrainerAvailability(username, date);
        // Emit updated availability to trainer room
        io.to(`trainer_${username}`).emit(
          "updatedAvailability",
          updatedTrainer.availability
        );
      } catch (error) {
        console.error("Error removing trainer availability:", error);
        socket.emit("error", { message: "Failed to remove availability" });
      }
    });

    // Handle fetching initial trainer data
    socket.on("fetchTrainerData", async ({ username }) => {
      try {
        const trainer = await getTrainerByUsername(username);
        if (!trainer) {
          socket.emit("error", { message: "Trainer not found" });
          return;
        }
        const messages = await getAllTrainerMessages(username);
        const bookings = await getUserBookings(username);
        socket.emit("trainerData", {
          messages,
          bookings,
          availability: trainer.availability,
        });
      } catch (error) {
        console.error("Error fetching trainer data:", error);
        socket.emit("error", { message: "Failed to fetch trainer data" });
      }
    });

    // Handle regular user-to-user messages
    socket.on(
      "sendMessage",
      async ({ senderUsername, receiverUsername, content }) => {
        try {
          if (
            !senderUsername ||
            !receiverUsername ||
            typeof senderUsername !== "string" ||
            typeof receiverUsername !== "string"
          ) {
            console.error(
              `Invalid usernames in sendMessage: senderUsername=${senderUsername}, receiverUsername=${receiverUsername}`
            );
            return;
          }

          const sender = await User.findOne({ username: senderUsername });
          const receiver = await User.findOne({ username: receiverUsername });
          if (!sender || !receiver) {
            console.error(
              `User not found: senderUsername=${senderUsername}, receiverUsername=${receiverUsername}`
            );
            return;
          }
          const senderId = sender._id.toString();
          const receiverId = receiver._id.toString();

          const message = await Message.create({
            senderId,
            receiverId,
            content,
            isRead: false,
          });

          const populatedMessage = await Message.findById(message._id)
            .populate("senderId", "username")
            .populate("receiverId", "username");

          io.to(senderId).to(receiverId).emit("newMessage", populatedMessage);
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    );

    socket.on("joinMatchRoom", (matchId) => {
      socket.join(matchId);
      console.log(`Client ${socket.id} joined room ${matchId}`);
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      let disconnectedUsername;
      for (let [username, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUsername = username;
          onlineUsers.delete(username);
          break;
        }
      }

      if (disconnectedUsername) {
        try {
          const user = await User.findOne({ username: disconnectedUsername });
          if (!user) {
            console.error(
              `User not found for username: ${disconnectedUsername}`
            );
            return;
          }
          const userId = user._id.toString();

          const friends = await Friend.find({
            $or: [{ userId }, { friendId: userId }],
            status: "accepted",
          });

          friends.forEach((friend) => {
            const friendId =
              friend.userId.toString() === userId
                ? friend.friendId.toString()
                : friend.userId.toString();
            io.to(friendId).emit("userStatus", {
              userId,
              status: "offline",
            });
          });
        } catch (error) {
          console.error("Error in disconnect event:", error);
        }
      }
    });
  });

  return io;
}

module.exports = { setupSocketIO };
