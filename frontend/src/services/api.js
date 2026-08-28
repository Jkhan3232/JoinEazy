import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1/api/v1";
const TOKEN_KEY = "12wedfgzxdrftgyhujctvygbhujtvybunij";

let unauthorizedHandler = null;

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const storeToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const clearStoredToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const registerUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  },
);

export default api;
