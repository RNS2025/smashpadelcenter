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
  trainerUsername: string,
  date: string,
  timeSlot: string
): Promise<any> => {
  const response = await api.post("/trainer-bookings", {
    username,
    trainerUsername,
    date,
    timeSlot,
  });
  return response.data;
};

export const sendTrainerMessage = async (
  senderUsername: string,
  trainerUsername: string,
  content: string
): Promise<any> => {
  const response = await api.post("/trainer-messages", {
    senderUsername,
    trainerUsername,
    content,
  });
  return response.data;
};

export const getUserBookings = async (username: string): Promise<any[]> => {
  const response = await api.get(`/trainer-bookings/user/${username}`);
  return response.data;
};

export const getTrainerMessages = async (
  username: string,
  trainerUsername: string
): Promise<any[]> => {
  const response = await api.get(
    `/trainer-messages/${username}/${trainerUsername}`
  );
  return response.data;
};
