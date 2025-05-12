import axios from "axios";

const ENV = import.meta.env.MODE;
const API_BASE_URL =
  ENV === "production"
    ? "https://smashpadelcenter-api.onrender.com/api/v1"
    : "http://localhost:3001/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export interface Message {
  _id: string;
  senderId: { _id: string; username: string };
  receiverId: { _id: string; username: string };
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface FriendRequest {
  _id: string;
  userId: { _id: string; username: string };
  friendId: { _id: string; username: string };
  status: "pending" | "accepted" | "rejected";
  createdAt: string; // Add this missing field
  notification?: {
    notificationId: string;
    title: string;
    body: string;
    category: string;
    isRead: boolean;
    createdAt: string;
  };
}

export class MessageService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // onNewMessage(callback: (message: Message) => void) {
  //   this.socket.on("newMessage", callback);
  // }

  // onMessageRead(
  //   callback: (data: { messageId: string; friendId: string }) => void
  // ) {
  //   this.socket.on("messageRead", callback);
  // }

  // onUserStatus(
  //   callback: (data: { userId: string; status: "online" | "offline" }) => void
  // ) {
  //   this.socket.on("userStatus", callback);
  // }

  // onFriendRequestSent(callback: (request: FriendRequest) => void) {
  //   this.socket.on("friendRequestSent", callback);
  // }

  // onFriendRequestResponded(
  //   callback: (data: {
  //     userId: { _id: string; username: string };
  //     friendId: { _id: string; username: string };
  //     status: "accepted" | "rejected";
  //   }) => void
  // ) {
  //   this.socket.on("friendRequestResponded", callback);
  // }

  async getMessages(friendId: string): Promise<Message[]> {
    try {
      const response = await api.get(`/messages/${friendId}`);
      return response.data;
    } catch (error) {
      console.error("Fejl ved hentning af beskeder:", error);
      throw error;
    }
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<Message> {
    try {
      const response = await api.post("/messages", {
        friendId: receiverId,
        content,
      });
      return response.data.data;
    } catch (error) {
      console.error("Fejl ved afsendelse af besked:", error);
      throw error;
    }
  }
}
