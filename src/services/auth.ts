/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import api from "../api/api";

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

export const getUsername = async () => {
  try {
    const response = await api.get("/username");
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch username");
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
