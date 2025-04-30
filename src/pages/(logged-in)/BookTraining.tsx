import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Trainer } from "../../types/Trainer";
import { useUser } from "../../context/UserContext";
import HomeBar from "../../components/misc/HomeBar";
import Animation from "../../components/misc/Animation";
import HomeScreenCard from "../../components/HomeScreen/HomeScreenCard";
import { UserIcon, AcademicCapIcon } from "@heroicons/react/24/outline";
import io, { Socket } from "socket.io-client";
import { createTrainer } from "../../services/trainingService";

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
  const socketRef = useRef<Socket | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  const [newTrainer, setNewTrainer] = useState<Partial<Trainer>>({
    username: "",
    name: "",
    specialty: "",
    image: "",
    bio: "",
    availability: [],
  });

  useEffect(() => {
    const ENV = import.meta.env.MODE;
    const apiUrl =
      ENV === "production"
        ? "https://smashpadelcenter-api.onrender.com"
        : "http://localhost:3001";

    console.log(`BookTraining connecting to socket at: ${apiUrl}`);
    socketRef.current = io(apiUrl, {
      path: "/api/v1/socket.io/",
      auth: { username },
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socketRef.current?.emit("fetchTrainers");
    });

    socketRef.current.on("trainersData", (trainers: Trainer[]) => {
      const uniqueTrainers = Array.from(
        new Map(trainers.map((trainer) => [trainer._id, trainer])).values()
      );
      setTrainers(uniqueTrainers);
    });

    socketRef.current.on("trainerMessagesData", (messages: any[]) => {
      setMessages((prev) => {
        const newMessages = messages
          .filter((msg) => !processedMessageIds.current.has(msg._id))
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        newMessages.forEach((msg) => processedMessageIds.current.add(msg._id));
        return [...prev, ...newMessages];
      });
    });

    socketRef.current.on("newTrainerMessage", (message: any) => {
      if (!processedMessageIds.current.has(message._id)) {
        processedMessageIds.current.add(message._id);
        setMessages((prev) => {
          const newMessages = [...prev, message].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return newMessages;
        });
      }
    });

    socketRef.current.on("trainerUpdated", (updatedTrainer: Trainer) => {
      setTrainers((prev) =>
        prev.map((trainer) =>
          trainer._id === updatedTrainer._id ? updatedTrainer : trainer
        )
      );
      if (selectedTrainer && selectedTrainer._id === updatedTrainer._id) {
        setSelectedTrainer(updatedTrainer);
      }
    });

    socketRef.current.on("error", (error: { message: string }) => {
      setError(error.message);
    });

    socketRef.current.emit("fetchTrainers");

    return () => {
      socketRef.current?.disconnect();
    };
  }, [username]);

  useEffect(() => {
    if (selectedTrainer && username && socketRef.current) {
      processedMessageIds.current.clear();
      setMessages([]);
      socketRef.current.emit("joinTrainerRoom", {
        username,
        trainerUsername: selectedTrainer.username,
      });
      socketRef.current.emit("fetchTrainerMessages", {
        username,
        trainerUsername: selectedTrainer.username,
      });
    }
  }, [selectedTrainer, username]);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCardClick = (trainer: Trainer) => {
    if (!Array.isArray(trainer.availability)) {
      trainer.availability = [];
    }
    setSelectedTrainer(trainer);
    setSelectedDate("");
    setSelectedTimeSlot("");
    setError(null);
  };

  const handleBookTrainer = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedTrainer || !username) {
      setError("Please select a date and time slot.");
      return;
    }

    socketRef.current?.emit("bookTrainer", {
      username,
      trainerUsername: selectedTrainer.username,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
    });

    socketRef.current?.once("newBooking", () => {
      alert("Booking successful!");
      setSelectedDate("");
      setSelectedTimeSlot("");
    });

    socketRef.current?.once("error", (error: { message: string }) => {
      setError(error.message);
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTrainer || !username) {
      setError("Please enter a message.");
      return;
    }

    socketRef.current?.emit("sendTrainerMessage", {
      senderUsername: username,
      trainerUsername: selectedTrainer.username,
      content: newMessage,
    });

    setNewMessage("");
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
      socketRef.current?.emit("fetchTrainers");
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
          <h1 className="text-3xl font-bold text-black text-center mb-8">
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
                  <h2 className="text-2xl font-semibold text-black">
                    {selectedTrainer.name}
                  </h2>
                  <p className="text-black">{selectedTrainer.specialty}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-black">
                  {selectedTrainer.bio || "No bio available."}
                </p>

                <div className="mt-4">
                  <h3 className="font-medium text-black">Book a Session</h3>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border p-2 rounded mt-2 w-full text-black"
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
                      className="border p-2 rounded mt-2 w-full text-black"
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
                  <div
                    className="h-40 overflow-y-auto border p-2 rounded mt-2"
                    ref={messageContainerRef}
                  >
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`mb-2 ${
                            msg.senderUsername === username
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          <p className="inline-block bg-gray-100 px-2 py-1 rounded text-black">
                            {msg.content}
                          </p>
                          <p className="text-xs text-black">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-black">No messages yet.</p>
                    )}
                  </div>
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="border p-2 rounded flex-1 text-black"
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
                  className="bg-gray-300 text-black px-4 py-2 rounded mt-4 hover:bg-gray-400"
                  onClick={() => setSelectedTrainer(null)}
                >
                  Back to Trainers
                </button>
              </div>
            </div>
          )}

          {role === "admin" && showAdminForm && (
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-black mb-4">
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
                    className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
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
