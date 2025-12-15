import api from "./api"
import {ResetPasswordType, UserType} from "@/types/user";


export const registerUser = async (user: UserType) => {
    return await api.post("/api/auth/register", user);
}
export const loginUser = async (user: UserType) => {
    return await api.post("/api/auth/login", user);
}

export const logOutUser = async () => {
    return await api.post( "/api/auth/logout", null );
}

export const refreshUser = async () => {
    return await api.get("/api/auth/refresh");
}

export const forgotPassword = async (user: UserType) => {
    return await api.post("/api/auth/forgot-password", user);
}

export const resetPassword = async (data: ResetPasswordType) => {
    return await api.put("/api/auth/reset-password", data);
}

export const getUsers = async () => {
    return  await api.get( "/api/user");
}

export const getMe = async (user:UserType) => {
    return  await api.post( "/api/user/me", user);
}

export const getTest = async ( user:UserType) => {
    return  await api.post("/api/user/cookie-test", user, {withCredentials:true});
}
