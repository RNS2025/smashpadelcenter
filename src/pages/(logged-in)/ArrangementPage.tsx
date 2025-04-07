import React, { useEffect, useState } from "react";
import { getAllEvents } from "../../services/smashEventService"; // Adjust the path as needed

const ArrangementPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]); // State to hold events
  const [loading, setLoading] = useState<boolean>(true); // State to track loading status
  const [error, setError] = useState<string | null>(null); // State to track error message

  useEffect(() => {
    // Fetch events when the component mounts
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await getAllEvents();

        // Ensure fetchedEvents is always an array
        if (Array.isArray(fetchedEvents)) {
          setEvents(fetchedEvents);
        } else {
          setEvents([]); // Set empty array if not an array
        }
        setLoading(false);
      } catch {
        setError("Failed to load events.");
        setLoading(false);
      }
    };

    fetchEvents();
  }, []); // Empty dependency array ensures this runs once when the component mounts

  if (loading) {
    return <div>Loading events...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Arrangement Page</h1>
      <p className="mb-4">Below is the list of upcoming Smash Padel events:</p>
      <ul className="space-y-4">
        {/* Ensure events is an array before calling map */}
        {Array.isArray(events) &&
          events.map((event, index) => (
            <li key={index} className="border p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold">{event.titel}</h2>
              <p>
                <strong>Date:</strong> {event.dato} at {event.tidspunkt}
              </p>
              <p>
                <strong>Venue:</strong> {event.sted}
              </p>
              <p>
                <strong>Instructor:</strong> {event.instruktør}
              </p>
              <p>
                <strong>Status:</strong> {event.status}
              </p>
              {event.billede && (
                <img
                  src={event.billede}
                  alt={event.titel}
                  className="mt-2 max-w-full h-auto rounded-lg"
                />
              )}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ArrangementPage;

// Todo Make sure events are shown correctly with date and time
