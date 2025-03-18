const API_BASE_URL =
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api/v1";

import axios from "axios";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post("/login", { username, password });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error("Login error:", error.response.data);
      throw new Error(
        error.response.data.message || "Invalid username or password"
      );
    } else {
      throw new Error("Network error or server unreachable");
    }
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

export const getUsers = async () => {
  try {
    const response = await api.get("/users");
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch users");
  }
};

export const changeUserRole = async (username: string, role: string) => {
  try {
    const response = await api.post("/change-role", { username, role });
    return response.data;
  } catch (error) {
    throw new Error("Failed to change user role");
  }
};

export const logout = async () => {
  try {
    await api.post("/logout");
    document.cookie =
      "session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly;";
  } catch (error) {
    throw new Error("Failed to log out. Please try again later.");
  }
};
