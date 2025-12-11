import api from "./api";
import { UserType} from "@/types/user";

export const registerUser = async (user: UserType) => {
    return await api.post("/api/user/register", user);
}

export const getUser = async () => {
    const response = await api.get("/api/user");
    return response.data;

}