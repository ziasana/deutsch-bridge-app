// services/api.js
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";
import usePremiumUpsellStore from "@/store/usePremiumUpsellStore";
const API_URL = "http://localhost:8080";

const api = axios.create({
    baseURL: API_URL + "/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

type FailedRequest = {
    resolve: (token: string | null) => void;
    reject: (error: unknown) => void;
};

// ---------------- Queue logic ----------------
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];


const processQueue = (error:unknown, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};
//  Add language automatically
api.interceptors.request.use((config) => {
    const state = useAuthStore.getState(); // ✅ correct
    const language = state.userProfile?.preferredLanguage || "EN";
    config.headers["Accept-Language"] = language.toUpperCase();
    return config;
});

// ---------------- Interceptor ----------------
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 429) {
            // A gated AI feature (chat/correction/example/synonym) hit its daily limit - surface the
            // upsell modal globally instead of every call site handling this status itself.
            usePremiumUpsellStore.getState().open(error.response?.data?.message);
            error.isFeatureLimitError = true;
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If refresh is already running, queue the request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch(err => {
                        throw err;
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            return new Promise(async (resolve, reject) => {
                try {
                    // Call refresh endpoint
                    await api.get("/auth/refresh", { withCredentials: true });
                    processQueue(null); // retry queued requests
                    resolve(api(originalRequest)); // retry original request
                } catch (err) {
                    processQueue(err, null); // reject queued requests
                    useAuthStore.getState().logout(); // logout
                    globalThis.location.href = "/login"; // redirect to login
                    reject(err);
                } finally {
                    isRefreshing = false;
                }
            });
        }

        throw error;
    }
);

export default api;
