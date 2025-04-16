import api from "../api/api";

export interface Friend {
  _id: string;
  userId: { _id: string; username: string };
  friendId: { _id: string; username: string };
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export const friendService = {
  addFriend: async (username: string): Promise<void> => {
    await api.post("/friends/add", { username });
  },
  respondToFriendRequest: async (
    friendId: string,
    status: "accepted" | "rejected"
  ): Promise<void> => {
    await api.post("/friends/respond", { friendId, status });
  },
  getFriends: async (): Promise<{
    friends: Friend[];
    pendingRequests: Friend[];
  }> => {
    const response = await api.get("/friends");
    console.log("Friends response:", response.data);
    return response.data;
  },
};
