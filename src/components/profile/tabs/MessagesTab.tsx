import React from "react";
import { Friend, Message } from "../../../services/friendService";
import { UserProfile } from "../../../types/UserProfile";

interface MessagesTabProps {
  friends: Friend[];
  messages: { [friendId: string]: Message[] };
  selectedFriend: string | null;
  newMessage: string;
  onlineStatus: { [userId: string]: "online" | "offline" };
  profile: UserProfile;
  setNewMessage: (value: string) => void;
  handleSelectFriend: (friendId: string) => void;
  handleSendMessage: () => void;
  successMessage: string;
  errorMessage: string;
}

const MessagesTab: React.FC<MessagesTabProps> = ({
  friends,
  messages,
  selectedFriend,
  newMessage,
  onlineStatus,
  profile,
  setNewMessage,
  handleSelectFriend,
  handleSendMessage,
  successMessage,
  errorMessage,
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Beskeder</h2>
      {friends.length ? (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Samtaler
            </h3>
            {friends.map((friend) => {
              const friendId =
                friend.userId._id.toString() === profile.id
                  ? friend.friendId._id
                  : friend.userId._id;
              const friendUsername =
                friend.userId._id.toString() === profile.id
                  ? friend.friendId.username
                  : friend.userId.username;
              const lastMessage = messages[friendId]?.slice(-1)[0];
              if (friendUsername === profile.username) {
                return null;
              }
              return (
                <div
                  key={friend._id}
                  className={`p-4 border-b border-gray-200 cursor-pointer ${
                    selectedFriend === friendId ? "bg-gray-100" : ""
                  }`}
                  onClick={() => handleSelectFriend(friendId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleSelectFriend(friendId);
                  }}
                >
                  <p className="text-sm font-medium text-gray-800">
                    {friendUsername}
                    <span
                      className={`text-xs ml-2 ${
                        onlineStatus[friendId] === "online"
                          ? "text-green-500"
                          : "text-gray-500"
                      }`}
                    >
                      ({onlineStatus[friendId] || "offline"})
                    </span>
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-gray-600 truncate">
                      {lastMessage.content}{" "}
                      {lastMessage.isRead ? (
                        <span className="text-blue-500">✓✓</span>
                      ) : (
                        <span className="text-gray-500">✓</span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="md:w-2/3">
            {selectedFriend ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Chat med{" "}
                  {(() => {
                    const friend = friends.find(
                      (f) => f.userId._id.toString() === selectedFriend
                    );
                    if (!friend) return "";
                    return friend.userId._id.toString() === profile.id
                      ? friend.friendId.username
                      : friend.userId.username;
                  })()}
                </h3>
                <div className="h-80 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 messages-container">
                  {messages[selectedFriend]?.map((msg) => (
                    <div
                      key={msg._id}
                      className={`mb-2 ${
                        msg.senderId._id.toString() === profile.id
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <p
                        className={`inline-block px-3 py-1 rounded-lg text-sm ${
                          msg.senderId._id.toString() === profile.id
                            ? "bg-cyan-100 text-cyan-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {msg.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString("da-DK", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {msg.senderId._id.toString() === profile.id &&
                          (msg.isRead ? (
                            <span className="text-blue-500">✓✓</span>
                          ) : (
                            <span className="text-gray-500">✓</span>
                          ))}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && newMessage.trim()) {
                        handleSendMessage();
                      }
                    }}
                    placeholder="Skriv en besked..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
                    aria-label="Skriv en besked"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="inline-flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                Vælg en ven for at starte en samtale.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-600">
          Tilføj venner for at begynde at sende beskeder.
        </p>
      )}
    </div>
  );
};

export default MessagesTab;
