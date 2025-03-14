import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Keep this to ensure cookies are sent
});

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post("/login", { username, password });
    return response.data;
  } catch (error) {
    throw new Error("Invalid username or password");
  }
};

export const register = async (username: string, password: string) => {
  try {
    const response = await api.post("/register", { username, password });
    return response.data;
  } catch (error) {
    throw new Error("Error creating user");
  }
};

export const getUserRole = async () => {
  try {
    const response = await api.get("/role");
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch user role");
  }
};
