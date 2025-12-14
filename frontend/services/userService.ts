import api from "./api";
import { UserType} from "@/types/user";
const BASE_URL="http://localhost:8080/api";

export const registerUser = async (user: UserType) => {
    return await api.post(BASE_URL+ "/auth/register", user);
}
export const loginUser = async (user: UserType) => {
    return await api.post(BASE_URL+ "/auth/login", user , {withCredentials: true});
}

export const logOutUser = async () => {
    return await api.post( BASE_URL + "/auth/logout", null );
}

export const refreshUser = async () => {
    return await api.get(BASE_URL+ "/auth/refresh", {withCredentials: true});
}

export const resetPassword = async (user: UserType) => {
    return await api.post(BASE_URL+ "/auth/reset-password", user);
}

export const getUsers = async () => {
    return  await api.get(BASE_URL+ "/user");
}

export const getMe = async (user:UserType) => {
    return  await api.post(BASE_URL+ "/user/me", user, {withCredentials:true});
}

export const getTest = async ( user:UserType) => {
    return  await api.post(BASE_URL+ "/user/cookie-test", user, {withCredentials:true});
}
