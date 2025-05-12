import api from "../api/api";
import { getFromCache, setToCache, clearCache } from "../utils/cache";

export const login = async (username: string, password: string) => {
  try {
    const response = await api.post("/login", { username, password });

    // Save token in localStorage
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to log in. Please try again."
    );
  }
};

export const getUserRole = async () => {
  const cacheKey = "userRole";
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await api.get("/role");
    setToCache(cacheKey, response.data);
    return response.data;
  } catch {
    throw new Error("Failed to fetch user role");
  }
};

export const getUsername = async () => {
  const cacheKey = "username";
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await api.get("/username");
    setToCache(cacheKey, response.data);
    return response.data;
  } catch {
    throw new Error("Failed to fetch username");
  }
};

export const getUsers = async () => {
  const cacheKey = "users";
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await api.get("/users");
    setToCache(cacheKey, response.data);
    return response.data;
  } catch {
    throw new Error("Failed to fetch users");
  }
};

export const changeUserRole = async (username: string, role: string) => {
  try {
    const response = await api.post("/change-role", { username, role });
    clearCache("users"); // Invalidate users cache
    return response.data;
  } catch {
    throw new Error("Failed to change user role");
  }
};

export const register = async (username: string, password: string) => {
  try {
    const response = await api.post("/register", { username, password });
    clearCache("users"); // Invalidate users cache
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to register. Please try again."
    );
  }
};
