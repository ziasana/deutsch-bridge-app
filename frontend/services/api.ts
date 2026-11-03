// services/api.js
import axios from "axios";
import useAuthStore from "@/store/useAuthStore";
import usePremiumUpsellStore from "@/store/usePremiumUpsellStore";
import { BACKEND_ORIGIN } from "@/lib/backendOrigin";

const api = axios.create({
    baseURL: BACKEND_ORIGIN + "/api",
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

// ---------------- Token refresh (single flight) ----------------
// One refresh at a time, shared by everyone: requests sent while it runs wait for it (so they go out with the new
// cookie), and a request that got its 401 from the old cookie is simply retried instead of starting another refresh.
let refreshPromise: Promise<void> | null = null;
let lastRefreshedAt = 0;

const isRefreshCall = (url?: string) => !!url && url.includes("/auth/refresh");

const refreshSession = (): Promise<void> => {
    if (!refreshPromise) {
        refreshPromise = api
            .get("/auth/refresh", { withCredentials: true })
            .then(() => {
                lastRefreshedAt = Date.now();
            })
            .finally(() => {
                refreshPromise = null;
            });
    }
    return refreshPromise;
};

const endSession = (err: unknown) => {
    useAuthStore.getState().logout();
    globalThis.location.href = "/login";
    return Promise.reject(err);
};

//  Add language automatically
api.interceptors.request.use((config) => {
    const state = useAuthStore.getState(); // ✅ correct
    const language = state.userProfile?.preferredLanguage || "EN";
    config.headers["Accept-Language"] = language.toUpperCase();
    (config as { _sentAt?: number })._sentAt = Date.now();
    // A refresh is running: wait for it so this request carries the renewed cookie.
    return refreshPromise && !isRefreshCall(config.url) ? refreshPromise.then(() => config, () => config) : config;
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

        if (error.response?.status === 401 && originalRequest && isRefreshCall(originalRequest.url)) {
            return endSession(error);
        }

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Sent before the latest refresh finished: its cookie was the old one, so a retry is enough.
                if (!refreshPromise && (originalRequest._sentAt ?? 0) > lastRefreshedAt) await refreshSession();
                else if (refreshPromise) await refreshPromise;
                return api(originalRequest);
            } catch (err) {
                if (axios.isAxiosError(err) && err.response?.status !== 401 && !isRefreshCall(err.config?.url)) throw err;
                return endSession(err);
            }
        }

        throw error;
    }
);

export default api;
