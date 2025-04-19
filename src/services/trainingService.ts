import api from "../api/api";
import { Trainer } from "../types/Trainer";

export const getAllTrainers = async (): Promise<Trainer[]> => {
  const response = await api.get<Trainer[]>("/trainers");
  return response.data;
};

export const createTrainer = async (trainer: Trainer): Promise<Trainer> => {
  const response = await api.post<Trainer>("/trainers", trainer);
  return response.data;
};

export const bookTrainer = async (
  username: string,
  trainerId: string,
  date: string,
  timeSlot: string
): Promise<any> => {
  const response = await api.post("/book", {
    username,
    trainerId,
    date,
    timeSlot,
  });
  return response.data;
};

export const getUserBookings = async (username: string): Promise<any[]> => {
  const response = await api.get(`/bookings/${username}`);
  return response.data;
};

export const sendTrainerMessage = async (
  senderUsername: string,
  trainerId: string,
  content: string
): Promise<any> => {
  const response = await api.post("/message", {
    senderUsername,
    trainerId,
    content,
  });
  return response.data;
};

export const getTrainerMessages = async (
  username: string,
  trainerId: string
): Promise<any[]> => {
  const response = await api.get(`/messages/${username}/${trainerId}`);
  return response.data;
};
