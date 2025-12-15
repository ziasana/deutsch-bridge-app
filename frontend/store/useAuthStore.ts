import { create } from "zustand";
import {UserType} from "@/types/user";
import {persist} from "zustand/middleware";
import {startSimpleRefresh} from "@/lib/tokenRefresher";
import { logOutUser} from "@/services/userService";

interface AuthState {
    user: UserType | null;
    isLoggedIn: boolean;
    sessionExpiresAt: number | null;
    hasHydrated: boolean;
    isRefreshing: boolean;

    login: (user: UserType) => void;
    logout: () => void;
    setHasHydrated: (value: boolean) => void;
    refreshSession: () => Promise<void>;
}

const ACCESS_TOKEN_TTL =  60 * 1000; // 1 min

const useAuthStore = create<AuthState>()
   (persist(
        (set, get) => ({
            user: null,
            isLoggedIn: false,
            hasHydrated: false,
            sessionExpiresAt: null,
            isRefreshing: false,

            login: (user) => {
                //const expiresAt = Date.now() + ACCESS_TOKEN_TTL;
                set({
                    user,
                    isLoggedIn: true,
                })
            },

            logout: () => {
                logOutUser();
                localStorage.removeItem("auth-storage");
                set({
                    user: null,
                    isLoggedIn: false,
                    sessionExpiresAt: null,
                    isRefreshing: false,

                });
            },

            refreshSession: async () => {
                const { isRefreshing } = get();
                if (isRefreshing) return;
                set({ isRefreshing: true });

                try {
                   // startSimpleRefresh();
                   //  console.log("refreshing now: ", new Date());
                    const expiresAt = Date.now() + ACCESS_TOKEN_TTL;
                    set({
                        sessionExpiresAt: expiresAt,
                        isLoggedIn: true,
                        isRefreshing: false,
                    });
                } catch {
                    get().logout();
                }
            },

            setHasHydrated: (value) =>
                set({
                    hasHydrated: value,

                }),
            }),
        {
          name: 'auth-storage', // key in localStorage
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

export default useAuthStore;