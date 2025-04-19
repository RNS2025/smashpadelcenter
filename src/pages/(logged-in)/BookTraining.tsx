import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Trainer } from "../../types/Trainer";
import { getAllTrainers, createTrainer } from "../../services/trainingService";
import { useUser } from "../../context/UserContext";
import HomeBar from "../../components/misc/HomeBar";
import Animation from "../../components/misc/Animation";
import HomeScreenCard from "../../components/HomeScreen/HomeScreenCard";
import { UserIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import io from "socket.io-client";
import api from "../../api/api";

const BookTraining: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const { role, username } = useUser();
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  const [newTrainer, setNewTrainer] = useState<Partial<Trainer>>({
    username: "",
    name: "",
    specialty: "",
    image: "",
    bio: "",
    availability: [],
  });

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
    socketRef.current = io(apiUrl, {
      withCredentials: true,
    });

    if (selectedTrainer && username) {
      // Clear existing messages when changing trainers
      setMessages([]);

      // Join room only once with a unique identifier
      socketRef.current.emit("joinTrainerRoom", {
        username,
        trainerUsername: selectedTrainer.username,
      });

      // Clean up ALL previous event listeners
      socketRef.current.off("newTrainerMessage");

      // Use a messageIds Set to track already shown messages
      const processedMessageIds = new Set();

      socketRef.current.on("newTrainerMessage", (message: any) => {
        // Skip if we've already processed this message ID
        if (processedMessageIds.has(message._id)) return;

        // Mark as processed
        processedMessageIds.add(message._id);

        setMessages((prev) => {
          // Also check if message already exists in current state
          if (prev.some((msg) => msg._id === message._id)) return prev;

          return [...prev, message];
        });
      });

      socketRef.current.on("error", (error: { message: string }) => {
        setError(error.message);
      });

      fetchMessages();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("newTrainerMessage");
        socketRef.current.disconnect();
      }
    };
  }, [selectedTrainer, username]);

  const fetchTrainers = async () => {
    try {
      const data = await getAllTrainers();
      console.log("Fetched trainers:", data);
      const uniqueTrainers = Array.from(
        new Map(data.map((trainer) => [trainer._id, trainer])).values()
      );
      setTrainers(uniqueTrainers);
    } catch (error) {
      console.error("Failed to fetch trainers:", error);
      setError("Failed to load trainers. Please try again.");
    }
  };

  const fetchMessages = async () => {
    if (!selectedTrainer || !username) return;
    try {
      const response = await api.get(
        `/messages/${username}/${selectedTrainer.username}`
      );
      console.log("Fetched messages:", response.data);
      setMessages(response.data);
    } catch (error: any) {
      console.error("Failed to fetch messages:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Failed to load messages. Please try again.";
      setError(errorMessage);
      console.log("Error details:", errorMessage);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleCardClick = (trainer: Trainer) => {
    if (!Array.isArray(trainer.availability)) {
      trainer.availability = [];
    }
    setSelectedTrainer(trainer);
    setError(null);
  };

  const handleBookTrainer = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedTrainer || !username) {
      setError("Please select a date and time slot.");
      return;
    }

    try {
      socketRef.current.emit("bookTrainer", {
        username,
        trainerUsername: selectedTrainer.username,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
      });
      alert("Booking successful!");
      setSelectedDate("");
      setSelectedTimeSlot("");
    } catch (error) {
      console.error("Failed to book trainer:", error);
      setError("Failed to book trainer. Please try again.");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTrainer || !username) {
      setError("Please enter a message.");
      return;
    }

    try {
      // Don't add messages locally, only emit to server and let the socket event add it
      // This prevents any possibility of duplication

      // Emit the message to the socket
      socketRef.current.emit("sendTrainerMessage", {
        senderUsername: username,
        trainerUsername: selectedTrainer.username,
        content: newMessage,
      });

      // Clear input field
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewTrainer((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTrainer = async () => {
    try {
      if (!newTrainer.username || !newTrainer.name || !newTrainer.specialty) {
        setError("Username, name, and specialty are required.");
        return;
      }
      await createTrainer(newTrainer as Trainer);
      setNewTrainer({
        username: "",
        name: "",
        specialty: "",
        image: "",
        bio: "",
        availability: [],
      });
      setShowAdminForm(false);
      await fetchTrainers();
    } catch (err: any) {
      console.error("Failed to create trainer:", err);
      setError(err.message || "Failed to create trainer. Please try again.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Book Training</title>
      </Helmet>
      <Animation>
        <HomeBar backPage="/hjem" />
        <div className="flex flex-col items-center justify-center min-h-screen -mt-20 overflow-y-hidden">
          <h1 className="text-3xl font-bold text-center mb-8">
            Book a Training Session
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!selectedTrainer && !showAdminForm && (
            <div
              className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${
                role === "admin" ? "lg:grid-cols-3" : "lg:grid-cols-2"
              }`}
            >
              {trainers.map((trainer, index) => (
                <div
                  key={`${trainer._id}-${index}`}
                  onClick={() => handleCardClick(trainer)}
                  className="cursor-pointer"
                >
                  <HomeScreenCard
                    icon={<UserIcon className="h-10 w-10" aria-hidden="true" />}
                    title={trainer.name || "Unnamed"}
                    description={trainer.specialty || "No specialty"}
                    imageUrl={
                      trainer.image || "https://via.placeholder.com/150"
                    }
                  />
                </div>
              ))}

              {role === "admin" && (
                <div
                  key="add-trainer"
                  onClick={() => setShowAdminForm(true)}
                  className="cursor-pointer"
                >
                  <HomeScreenCard
                    icon={
                      <AcademicCapIcon
                        className="h-10 w-10"
                        aria-hidden="true"
                      />
                    }
                    title="Add New Trainer"
                    description="Create a new trainer profile"
                  />
                </div>
              )}
            </div>
          )}

          {selectedTrainer && (
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <img
                  src={
                    selectedTrainer.image || "https://via.placeholder.com/150"
                  }
                  alt={selectedTrainer.name}
                  className="w-24 h-24 rounded-full object-cover mr-4"
                />
                <div>
                  <h2 className="text-2xl font-semibold">
                    {selectedTrainer.name}
                  </h2>
                  <p className="text-gray-600">{selectedTrainer.specialty}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-gray-700">
                  {selectedTrainer.bio || "No bio available."}
                </p>

                <div className="mt-4">
                  <h3 className="font-medium">Book a Session</h3>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border p-2 rounded mt-2 w-full"
                  >
                    <option value="">Select Date</option>
                    {Array.isArray(selectedTrainer.availability) &&
                    selectedTrainer.availability.length > 0 ? (
                      selectedTrainer.availability.map((avail) => (
                        <option
                          key={avail.date.toString()}
                          value={avail.date.toString().split("T")[0]}
                        >
                          {new Date(avail.date).toLocaleDateString()}
                        </option>
                      ))
                    ) : (
                      <option disabled>No available dates</option>
                    )}
                  </select>

                  {selectedDate && (
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="border p-2 rounded mt-2 w-full"
                    >
                      <option value="">Select Time Slot</option>
                      {(() => {
                        const selectedAvail = Array.isArray(
                          selectedTrainer.availability
                        )
                          ? selectedTrainer.availability.find(
                              (avail) =>
                                avail.date.toString().split("T")[0] ===
                                selectedDate
                            )
                          : null;
                        const timeSlots = selectedAvail?.timeSlots?.filter(
                          (slot) => !slot.isBooked
                        );
                        return Array.isArray(timeSlots) &&
                          timeSlots.length > 0 ? (
                          timeSlots.map((slot) => (
                            <option key={slot.startTime} value={slot.startTime}>
                              {slot.startTime}
                            </option>
                          ))
                        ) : (
                          <option disabled>No available time slots</option>
                        );
                      })()}
                    </select>
                  )}

                  <button
                    onClick={handleBookTrainer}
                    disabled={!selectedDate || !selectedTimeSlot}
                    className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    Book Now
                  </button>
                </div>

                <div className="mt-4">
                  <h3 className="font-medium text-black">Messages</h3>
                  <div className="h-40 overflow-y-auto border p-2 rounded mt-2">
                    {messages.map((msg, index) => (
                      <div
                        key={`${msg._id || "msg"}-${index}`} // Add index as fallback to ensure uniqueness
                        className={`mb-2 ${
                          msg.senderUsername === username
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        <p className="inline-block bg-gray-100 px-2 py-1 rounded">
                          {msg.content}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex mt-2 text-black">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="border p-2 rounded flex-1"
                      placeholder="Type a message..."
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-500 text-white px-4 py-2 rounded ml-2 hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      Send
                    </button>
                  </div>
                </div>

                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded mt-4 hover:bg-gray-400"
                  onClick={() => setSelectedTrainer(null)}
                >
                  Back to Trainers
                </button>
              </div>
            </div>
          )}

          {role === "admin" && showAdminForm && (
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-black">
                Add New Trainer
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <input
                  name="username"
                  value={newTrainer.username || ""}
                  onChange={handleInputChange}
                  placeholder="Username"
                  className="border p-2 rounded text-black"
                  required
                />
                <input
                  name="name"
                  value={newTrainer.name || ""}
                  onChange={handleInputChange}
                  placeholder="Name"
                  className="border p-2 rounded text-black"
                />
                <input
                  name="specialty"
                  value={newTrainer.specialty || ""}
                  onChange={handleInputChange}
                  placeholder="Specialty"
                  className="border p-2 rounded text-black"
                />
                <input
                  name="image"
                  value={newTrainer.image || ""}
                  onChange={handleInputChange}
                  placeholder="Image URL"
                  className="border p-2 rounded text-black"
                />
                <textarea
                  name="bio"
                  value={newTrainer.bio || ""}
                  onChange={handleInputChange}
                  placeholder="Bio"
                  className="border p-2 rounded text-black"
                  rows={4}
                />
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => setShowAdminForm(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTrainer}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Create Trainer
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Animation>
    </>
  );
};

export default BookTraining;
