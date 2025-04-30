import axios from "axios";

// const ENV =
//   import.meta.env.NODE_ENV === "production" ? "production" : "development";
const API_BASE_URL = "/api/v1";

// if (ENV === "production") {
//   API_BASE_URL = "https://smashpadelcenter-api.onrender.com/api/v1";
// } else if (ENV === "development") {
//   API_BASE_URL = "http://localhost:3001/api/v1";
// } else {
//   throw new Error("Invalid environment configuration");
// }

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(
      `Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      { params: config.params, data: config.data }
    );

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

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("Response error:", error.response || error);
    return Promise.reject(error);
  }
);

export default api;
