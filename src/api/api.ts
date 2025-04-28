const API_BASE_URL = "http://localhost:3000/api/v1";

import axios from "axios";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
