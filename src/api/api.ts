import axios from "axios";

const ENV =
  import.meta.env.NODE_ENV === "production" ? "production" : "development";
let API_BASE_URL = "";

if (ENV === "production") {
  API_BASE_URL = "https://smashpadelcenter-api.onrender.com/api/v1";
} else if (ENV === "development") {
  API_BASE_URL = "http://localhost:3001/api/v1";
} else {
  throw new Error("Invalid environment configuration");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
