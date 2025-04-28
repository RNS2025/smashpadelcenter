import api from "../api/api";
import { Trainer } from "../types/Trainer";
import { io } from "socket.io-client";

// Set up the socket connection based on environment
const ENV = import.meta.env.MODE;
const SOCKET_URL =
  ENV === "production"
    ? "http://rnssmashapi-g6gde0fvefhchqb3.westeurope-01.azurewebsites.net"
    : "http://localhost:3001";

console.log(`TrainingService connecting to socket at: ${SOCKET_URL}`);

const socket = io(SOCKET_URL, {
  path: "/socket.io/",
  transports: ["polling", "websocket"],
  withCredentials: true,
  reconnection: true,
});

export const getAllTrainers = async (): Promise<Trainer[]> => {
  const response = await api.get<Trainer[]>("/trainers");
  return response.data;
};

export const createTrainer = async (trainer: Trainer): Promise<Trainer> => {
  const response = await api.post<Trainer>("/trainers", trainer);
  return response.data;
};

export const bookTrainer = (
  username: string,
  trainerUsername: string,
  date: string,
  timeSlot: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    socket.emit("bookTrainer", { username, trainerUsername, date, timeSlot });
    socket.on("newBooking", (booking) => resolve(booking));
    socket.on("error", ({ message }) => reject(new Error(message)));
  });
};

export const sendTrainerMessage = (
  senderUsername: string,
  trainerUsername: string,
  content: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    socket.emit("sendTrainerMessage", {
      senderUsername,
      trainerUsername,
      content,
    });
    socket.on("newTrainerMessage", (message) => resolve(message));
    socket.on("error", ({ message }) => reject(new Error(message)));
  });
};

export const getUserBookings = (username: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    socket.emit("fetchTrainerData", { username });
    socket.on("trainerData", ({ bookings }) => resolve(bookings));
    socket.on("error", ({ message }) => reject(new Error(message)));
  });
};

export const getTrainerMessages = (
  username: string,
  trainerUsername: string
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    socket.emit("fetchTrainerData", { username });
    socket.on("trainerData", ({ messages }) =>
      resolve(
        messages.filter(
          (msg: any) =>
            (msg.senderUsername === username &&
              msg.trainerUsername === trainerUsername) ||
            (msg.senderUsername === trainerUsername &&
              msg.trainerUsername === username)
        )
      )
    );
    socket.on("error", ({ message }) => reject(new Error(message)));
  });
};
