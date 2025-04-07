import React, { useEffect, useState } from "react";
import { Trainer } from "../../types/Trainer";
import { getAllTrainers, createTrainer } from "../../services/trainingService";
import { useUser } from "../../context/UserContext";

const BookTraining: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const { role } = useUser();
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(
    null
  );

  const [newTrainer, setNewTrainer] = useState<Partial<Trainer>>({
    name: "",
    specialty: "",
    image: "",
    bio: "",
    availability: "",
  });

  const fetchTrainers = async () => {
    try {
      const data = await getAllTrainers();
      setTrainers(data);
    } catch (error) {
      console.error("Failed to fetch trainers:", error);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  const handleCardClick = (id: string) => {
    setSelectedTrainerId(selectedTrainerId === id ? null : id);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewTrainer((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTrainer = async () => {
    try {
      await createTrainer(newTrainer as Trainer);
      setNewTrainer({
        name: "",
        specialty: "",
        image: "",
        bio: "",
        availability: "",
      });
      await fetchTrainers();
    } catch (err) {
      console.error("Failed to create trainer:", err);
    }
  };

  return (
    <div className="p-4 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center mb-8">
        Book a Training Session
      </h1>

      {role === "admin" && (
        <div className="mb-12 max-w-2xl mx-auto bg-white p-6 rounded shadow">
          <h2 className="text-2xl font-semibold mb-4">
            Admin - Add New Trainer
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              name="name"
              value={newTrainer.name || ""}
              onChange={handleInputChange}
              placeholder="Name"
              className="border p-2 rounded"
            />
            <input
              name="specialty"
              value={newTrainer.specialty || ""}
              onChange={handleInputChange}
              placeholder="Specialty"
              className="border p-2 rounded"
            />
            <input
              name="image"
              value={newTrainer.image || ""}
              onChange={handleInputChange}
              placeholder="Image URL"
              className="border p-2 rounded"
            />
            <textarea
              name="bio"
              value={newTrainer.bio || ""}
              onChange={handleInputChange}
              placeholder="Bio"
              className="border p-2 rounded"
            />
            <input
              name="availability"
              value={newTrainer.availability || ""}
              onChange={handleInputChange}
              placeholder="Availability"
              className="border p-2 rounded"
            />
            <button
              onClick={handleCreateTrainer}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Create Trainer
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {trainers.map((trainer) => {
          const isSelected = selectedTrainerId === trainer._id;
          return (
            <div
              key={trainer._id}
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 cursor-pointer ${
                isSelected
                  ? "col-span-full scale-105 z-10 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-2xl"
                  : "hover:shadow-lg"
              }`}
              onClick={() => handleCardClick(trainer._id)}
            >
              <img
                src={trainer.image || "https://via.placeholder.com/150"}
                alt={trainer.name || "Trainer"}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold">
                  {trainer.name || "Unnamed"}
                </h2>
                <p className="text-gray-600">
                  {trainer.specialty || "No specialty"}
                </p>
                {isSelected && (
                  <div className="mt-4">
                    <p className="text-gray-700">
                      {trainer.bio || "No bio available."}
                    </p>
                    <p className="mt-2 font-medium">Availability:</p>
                    <p className="text-gray-600">
                      {trainer.availability || "Not specified"}
                    </p>
                    <button
                      className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(
                          `Booking with ${trainer.name} - Feature coming soon!`
                          // TODO: Implement booking functionality
                        );
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookTraining;
