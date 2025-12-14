// services/api.js

import axios from "axios";
import useAuthStore from "@/store/useAuthStore";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add interceptors
api.interceptors.response.use(
  (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error.response);
    }
);

export default api;
