import React from "react";
import { Friend } from "../../../services/friendService.ts";
import { UserProfile } from "../../../types/UserProfile.ts";

interface FriendsTabProps {
  friends: Friend[];
  pendingRequests: Friend[];
  newFriendUsername: string;
  profile: UserProfile;
  setNewFriendUsername: (value: string) => void;
  handleAddFriend: () => void;
  handleRespondToFriendRequest: (
    friendId: string,
    status: "accepted" | "rejected"
  ) => void;
  handleSelectFriend: (friendId: string) => void;
  successMessage: string;
  errorMessage: string;
}

const FriendsTab = ({
  friends,
  pendingRequests,
  newFriendUsername,
  profile,
  setNewFriendUsername,
  handleAddFriend,
  handleRespondToFriendRequest,
  handleSelectFriend,
  successMessage,
  errorMessage,
}: FriendsTabProps) => {
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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Venner</h2>
      <div className="mb-6">
        <label
          htmlFor="newFriend"
          className="block text-sm font-medium text-gray-600"
        >
          Tilføj en ven
        </label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            id="newFriend"
            value={newFriendUsername}
            onChange={(e) => setNewFriendUsername(e.target.value)}
            placeholder="Indtast brugernavn"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm text-gray-800"
            aria-label="Indtast vens brugernavn"
          />
          <button
            onClick={handleAddFriend}
            disabled={!newFriendUsername.trim()}
            className="inline-flex justify-center py-2 px-4 rounded-lg text-sm font-medium text-white bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Tilføj
          </button>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Afventende anmodninger
      </h3>
      {pendingRequests.length ? (
        <div className="space-y-2 mb-6">
          {pendingRequests.map((request) => (
            <div
              key={request._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <span className="text-sm text-gray-800">
                {request.userId.username}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleRespondToFriendRequest(request.userId._id, "accepted")
                  }
                  className="py-1 px-3 rounded-lg text-sm font-medium text-white bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300"
                >
                  Accepter
                </button>
                <button
                  onClick={() =>
                    handleRespondToFriendRequest(request.userId._id, "rejected")
                  }
                  className="py-1 px-3 rounded-lg text-sm font-medium text-white bg-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-300"
                >
                  Afvis
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 mb-6">Ingen afventende anmodninger.</p>
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Dine venner</h3>
      {friends.length ? (
        <div className="space-y-2">
          {friends.map((friend) => {
            const friendId =
              friend.userId._id.toString() === profile.id
                ? friend.friendId._id
                : friend.userId._id;
            const friendUsername =
              friend.userId._id.toString() === profile.id
                ? friend.friendId.username
                : friend.userId.username;

            if (friendUsername === profile.username) {
              return null; // Skip rendering if the username matches the logged-in user
            }
            return (
              <div
                key={friend._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <span className="text-sm text-gray-800">{friendUsername}</span>
                <button
                  onClick={() => handleSelectFriend(friendId)}
                  className="py-1 px-3 rounded-lg text-sm font-medium text-white bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition duration-300"
                >
                  Chat
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-600">Ingen venner endnu.</p>
      )}
    </div>
  );
};

export default FriendsTab;
