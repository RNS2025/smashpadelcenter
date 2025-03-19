const API_BASE_URL =
  import.meta.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api/v1";

import axios from "axios";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
