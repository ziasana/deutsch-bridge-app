import api from "./api"
import {ResetPasswordType, UserProfileType, UserType} from "@/types/user";
import {OnboardingRequest} from "@/types/onboarding";


export const registerUser = async (user: UserType) => {
    return await api.post("/auth/register", user);
}
export const loginUser = async (user: UserType) => {
    return await api.post("/auth/login", user);
}

export const logOutUser = async () => {
    return await api.post( "/auth/logout", null );
}

export const refreshUser = async () => {
    return await api.get("/auth/refresh");
}

export const forgotPassword = async (user: UserType) => {
    return await api.post("/auth/forgot-password", user);
}

export const resetPassword = async (data: ResetPasswordType) => {
    return await api.put("/auth/reset-password", data);
}

export const updateProfile = async (data: UserProfileType) => {
    return await api.put("/user/update-profile", data);
}

export const completeOnboarding = async (data: OnboardingRequest) => {
    return await api.put("/user/onboarding", data);
}

export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return await api.post<{ message: string; data: string }>("/user/avatar", formData, {
        headers: { "Content-Type": undefined },
    });
}

export const getUserProfile = async () => {
    return await api.get("/user/profile");
}

export const updatePassword = async (data: UserType) => {
    return await api.put("/user/update-password", data);
}


export const getUsers = async () => {
    return  await api.get( "/user");
}

export const getMe = async (user:UserType) => {
    return  await api.post( "/user/me", user);
}

export const getTest = async ( user:UserType) => {
    return  await api.post("/user/cookie-test", user, {withCredentials:true});
}
