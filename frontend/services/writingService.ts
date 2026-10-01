import api from "./api";
import { WritingLearningResponse } from "@/types/writing";

export const getWritingLearning = async (level: string) => {
    return await api.get<WritingLearningResponse>("/writing/learn", { params: { level } });
};
