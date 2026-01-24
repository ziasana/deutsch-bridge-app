import api from "./api";
import { NomenVerb } from "@/types/nomenVerb"
import {LearningProgressRequest} from "../types/nomenVerb";

export const getNomenVerbs = async () => {
    return  await api.get<NomenVerb[]>("/nomen-verb");
}

export const setLearningProgress = async (request: LearningProgressRequest) => {
    return await api.post("/learning-progress", request);
}
