import { create } from "zustand";
import {UserType} from "@/types/user";

interface AuthState {
    user: UserType | null;
    isLoggedIn: boolean;
    login: (user: UserType) => void;
    logout: () => void;
}
const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoggedIn: false,

    login: (user) =>
        set({
            user,
            isLoggedIn: true,
        }),

    logout: () =>
        set({
            user: null,
            isLoggedIn: false,
        }),
}));

export default useAuthStore;