// services/api.js

import axios from "axios";
import useAuthStore from "@/store/useAuthStore";
const API_URL = "http://localhost:8080";

const api = axios.create({
    baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
    withCredentials: true,
});


// ---------------- Queue logic ----------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ---------------- Interceptor ----------------
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If refresh is already running, queue the request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            return new Promise(async (resolve, reject) => {
                try {
                    // Call refresh endpoint
                    await api.get("/api/auth/refresh", { withCredentials: true });
                    processQueue(null); // retry queued requests
                    resolve(api(originalRequest)); // retry original request
                } catch (err) {
                    processQueue(err, null); // reject queued requests
                    useAuthStore.getState().logout(); // logout
                    window.location.href = "/login"; // redirect to login
                    reject(err);
                } finally {
                    isRefreshing = false;
                }
            });
        }

        return Promise.reject(error);
    }
);

export default api;
