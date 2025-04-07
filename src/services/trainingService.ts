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
