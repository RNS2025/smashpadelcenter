import api from "../api/api"; // Adjust the path if necessary

// Function to fetch all events
export const getAllEvents = async () => {
  try {
    const response = await api.get("/events");
    console.log("Fetched events:", response.data); // Log the fetched events for debugging
    return response.data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error; // You could throw an error or handle it gracefully in the UI
  }
};
