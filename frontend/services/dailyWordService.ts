import api from "./api";
import { DailyWord } from "@/types/dailyWord";

export const getDailyWords = async () => {
    return await api.get<DailyWord[]>("/daily-words");
};
