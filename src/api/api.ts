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

console.log("API_BASE_URL:", API_BASE_URL);
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
