import api from "../api/api";

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post("/login", { username, password });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to log in. Please try again."
    );
  }
};

export const logout = async () => {
  try {
    await api.post("/logout");
  } catch (error) {
    throw new Error("Failed to log out. Please try again later.");
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

export const loginWithProvider = (provider: string) => {
  const ENV = import.meta.env.MODE;
  const BACKEND_URL =
    ENV === "production"
      ? "https://smashpadelcenter-api.onrender.com"
      : "http://localhost:3001";
  window.location.href = `${BACKEND_URL}/api/v1/auth/${provider}`;
};

export const register = async (username: string, password: string) => {
  try {
    const response = await api.post("/register", { username, password });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to register. Please try again."
    );
  }
};
