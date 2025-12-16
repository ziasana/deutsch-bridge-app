import { create } from "zustand";
import {UserProfileType} from "@/types/user";
import {persist} from "zustand/middleware";
import { logOutUser} from "@/services/userService";
import {redirect} from "next/navigation";

interface AuthState {
    userProfile: UserProfileType | null;
    isLoggedIn: boolean;
    hasHydrated: boolean;
    login: (userProfile: UserProfileType) => void;
    logout: () => void;
    setHasHydrated: (value: boolean) => void;
    updateUserProfile: (userProfile: UserProfileType) => void;
}

const useAuthStore = create<AuthState>()
   (persist(
        (set, get) => ({
            userProfile: null,
            isLoggedIn: false,
            hasHydrated: false,

            login: (userProfile) => {
                set({
                    userProfile,
                    isLoggedIn: true,
                })
            },

            logout: () => {
                logOutUser();
                localStorage.removeItem("auth-storage");
                set({
                    userProfile: null,
                    isLoggedIn: false,
                });
               redirect("/login");
            },

            updateUserProfile: (userProfile) => {
                set({
                    userProfile,
                })
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