import axios from "axios";

const ENV = import.meta.env.MODE; // Use import.meta.env.MODE for Vite
let API_BASE_URL = "";

if (ENV === "production") {
  API_BASE_URL = "/api/v1";
} else if (ENV === "development") {
  API_BASE_URL = "http://localhost:3001/api/v1";
} else {
  throw new Error("Invalid environment configuration");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    // Add token from localStorage to Authorization header if it exists
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

export default api;
