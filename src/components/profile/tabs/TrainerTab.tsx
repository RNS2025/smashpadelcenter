import React, { useState, useMemo } from "react";

interface TrainerTabProps {
  loadingTrainerData: boolean;
  trainerBookings: any[];
  trainerMessages: any[];
  availabilityDate: string;
  availabilityTimeSlots: string[];
  newTimeSlot: string;
  isSubmitting: boolean;
  successMessage: string;
  errorMessage: string;
  loggedInUsername: string; // Add this prop to know who's logged in
  setAvailabilityDate: (value: string) => void;
  setNewTimeSlot: (value: string) => void;
  handleAddTimeSlot: () => void;
  handleRemoveTimeSlot: (index: number) => void;
  handleSaveAvailability: () => void;
  handleReplyToMessage: (
    messageId: string,
    content: string,
    trainerUsername: string
  ) => void;
}

const TrainerTab: React.FC<TrainerTabProps> = ({
  loadingTrainerData,
  trainerBookings,
  trainerMessages,
  availabilityDate,
  availabilityTimeSlots,
  newTimeSlot,
  isSubmitting,
  successMessage,
  errorMessage,
  loggedInUsername, // The logged-in trainer's username
  setAvailabilityDate,
  setNewTimeSlot,
  handleAddTimeSlot,
  handleRemoveTimeSlot,
  handleSaveAvailability,
  handleReplyToMessage,
}) => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Compute unique users with their latest message timestamp
  // Only include users that have sent messages to this trainer (not the trainer themselves)
  const uniqueUsers = useMemo(() => {
    const userMap = new Map<
      string,
      { username: string; latestMessage: Date }
    >();

    trainerMessages.forEach((message) => {
      // Find the username of the other person in the conversation
      const otherUsername =
        message.senderUsername === loggedInUsername
          ? message.trainerUsername
          : message.senderUsername;

      // Skip if this is a message from the trainer to themselves (shouldn't happen normally)
      if (otherUsername === loggedInUsername) return;

      const messageDate = new Date(message.createdAt);

      if (
        !userMap.has(otherUsername) ||
        messageDate > userMap.get(otherUsername)!.latestMessage
      ) {
        userMap.set(otherUsername, {
          username: otherUsername,
          latestMessage: messageDate,
        });
      }
    });

    return Array.from(userMap.values()).sort(
      (a, b) => b.latestMessage.getTime() - a.latestMessage.getTime()
    );
  }, [trainerMessages, loggedInUsername]);

  // Filter messages for the selected user, but ensure we only show each message once
  const selectedMessages = useMemo(() => {
    if (!selectedUser) return [];

    // Use a Map to track unique messages by ID
    const uniqueMessages = new Map();

    trainerMessages.forEach((msg) => {
      // Only include messages between the selected user and logged-in trainer
      const isRelevantConversation =
        (msg.senderUsername === selectedUser &&
          msg.trainerUsername === loggedInUsername) ||
        (msg.senderUsername === loggedInUsername &&
          msg.trainerUsername === selectedUser);

      if (isRelevantConversation && !uniqueMessages.has(msg._id)) {
        uniqueMessages.set(msg._id, msg);
      }
    });

    // Convert back to array and sort by timestamp
    return Array.from(uniqueMessages.values()).sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [selectedUser, trainerMessages, loggedInUsername]);

  return (
    <div className="text-black">
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg">
          <p className="text-sm">{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Træner Dashboard
      </h2>

      {loadingTrainerData ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-lg text-gray-700">Indlæser data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Availability Management Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Administrer Tilgængelighed
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Dato</label>
                <input
                  type="date"
                  value={availabilityDate}
                  onChange={(e) => setAvailabilityDate(e.target.value)}
                  className="border rounded-md p-2 w-full"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Tidspunkter</label>
                <div className="flex">
                  <input
                    type="time"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="border rounded-md p-2 flex-1"
                  />
                  <button
                    onClick={handleAddTimeSlot}
                    disabled={!newTimeSlot}
                    className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
                  >
                    Tilføj
                  </button>
                </div>
              </div>
              {availabilityTimeSlots.length > 0 && (
                <div className="mt-4">
                  <label className="block text-gray-700 mb-2">
                    Valgte tider:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availabilityTimeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                      >
                        <span>{slot}</span>
                        <button
                          onClick={() => handleRemoveTimeSlot(index)}
                          className="ml-2 text-blue-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={handleSaveAvailability}
                disabled={
                  !availabilityDate ||
                  availabilityTimeSlots.length === 0 ||
                  isSubmitting
                }
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md disabled:bg-gray-300"
              >
                {isSubmitting ? "Gemmer..." : "Gem Tilgængelighed"}
              </button>
            </div>
          </div>

          {/* Bookings Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Dine Bookinger
            </h3>
            {trainerBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bruger
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trainerBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.username}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(booking.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.timeSlot}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {booking.status === "confirmed"
                              ? "Bekræftet"
                              : booking.status === "cancelled"
                              ? "Annulleret"
                              : "Afventer"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">Du har ingen bookinger endnu.</p>
            )}
          </div>

          {/* Messages Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Beskeder fra Brugere
            </h3>
            <div className="flex">
              {/* User List */}
              <div className="w-1/3 border-r pr-4">
                <h4 className="text-lg font-medium mb-2">Brugere</h4>
                {uniqueUsers.length > 0 ? (
                  <ul className="space-y-2">
                    {uniqueUsers.map((user) => (
                      <li
                        key={user.username}
                        className={`p-2 rounded cursor-pointer ${
                          selectedUser === user.username
                            ? "bg-blue-100 text-blue-800"
                            : ""
                        }`}
                        onClick={() => setSelectedUser(user.username)}
                      >
                        <div className="flex justify-between">
                          <span>{user.username}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(user.latestMessage).toLocaleString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">
                    Ingen brugere har skrevet endnu.
                  </p>
                )}
              </div>

              {/* Messages for Selected User */}
              <div className="w-2/3 pl-4">
                {selectedUser ? (
                  <div>
                    <h4 className="text-lg font-medium mb-2">
                      Beskeder med {selectedUser}
                    </h4>
                    <div className="h-64 overflow-y-auto border p-2 rounded mb-4">
                      {selectedMessages.length > 0 ? (
                        selectedMessages.map((message) => (
                          <div
                            key={message._id}
                            className={`mb-2 ${
                              message.senderUsername === loggedInUsername
                                ? "text-right"
                                : "text-left"
                            }`}
                          >
                            <div
                              className={`inline-block px-3 py-2 rounded-lg ${
                                message.senderUsername === loggedInUsername
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-200 text-gray-800"
                              }`}
                            >
                              {message.content}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(message.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600">
                          Ingen beskeder med denne bruger.
                        </p>
                      )}
                    </div>
                    <div>
                      <textarea
                        className="w-full border rounded p-2"
                        rows={2}
                        placeholder="Skriv dit svar her..."
                        id={`reply-${selectedUser}`}
                      ></textarea>
                      <button
                        onClick={() => {
                          const replyEl = document.getElementById(
                            `reply-${selectedUser}`
                          ) as HTMLTextAreaElement;
                          if (replyEl && replyEl.value.trim()) {
                            handleReplyToMessage(
                              selectedMessages[selectedMessages.length - 1]
                                ?._id || "",
                              replyEl.value,
                              selectedUser
                            );
                            replyEl.value = "";
                          }
                        }}
                        className="mt-2 px-4 py-1 bg-blue-500 text-white rounded-md"
                      >
                        Send svar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Vælg en bruger for at se beskeder.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerTab;
