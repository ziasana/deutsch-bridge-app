import api from "./api";
import { UserType} from "@/types/user";
const BASE_URL="http://localhost:8080/api";

export const registerUser = async (user: UserType) => {
    return await api.post(BASE_URL+ "/user/register", user);
}
export const loginUser = async (user: UserType) => {
    return await api.post(BASE_URL+"/auth", user);
}

export const resetPassword = async (user: UserType) => {
    return await api.post(BASE_URL+ "/user/reset-password", user);
}

export const getUser = async () => {
    const response = await api.get("/api/user");
    return response.data;

}