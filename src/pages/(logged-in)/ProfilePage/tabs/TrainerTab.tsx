import React from "react";

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
  setAvailabilityDate: (value: string) => void;
  setNewTimeSlot: (value: string) => void;
  handleAddTimeSlot: () => void;
  handleRemoveTimeSlot: (index: number) => void;
  handleSaveAvailability: () => void;
  handleReplyToMessage: (messageId: string, content: string) => void;
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
  setAvailabilityDate,
  setNewTimeSlot,
  handleAddTimeSlot,
  handleRemoveTimeSlot,
  handleSaveAvailability,
  handleReplyToMessage,
}) => {
  return (
    <div>
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
                    className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
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
                          className="ml-2 text-blue-500 hover:text-blue-700"
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
                className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300"
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
            {trainerMessages.length > 0 ? (
              <div className="space-y-4">
                {trainerMessages.map((message) => (
                  <div
                    key={message._id}
                    className="border rounded-lg p-4 bg-white"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">
                        {message.senderUsername}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{message.content}</p>
                    <details className="mt-2">
                      <summary className="text-blue-600 cursor-pointer">
                        Svar
                      </summary>
                      <div className="mt-2">
                        <textarea
                          className="w-full border rounded p-2"
                          rows={2}
                          placeholder="Skriv dit svar her..."
                          id={`reply-${message._id}`}
                        ></textarea>
                        <button
                          onClick={() => {
                            const replyEl = document.getElementById(
                              `reply-${message._id}`
                            ) as HTMLTextAreaElement;
                            if (replyEl) {
                              handleReplyToMessage(message._id, replyEl.value);
                              replyEl.value = "";
                            }
                          }}
                          className="mt-2 px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                        >
                          Send svar
                        </button>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Du har ingen beskeder endnu.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerTab;
