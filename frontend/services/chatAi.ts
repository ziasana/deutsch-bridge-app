import api from "./api";
import {type ChatRequest} from "@/types/chat"


export const chatAi = async (chatRequest: ChatRequest) => {
    const response= await api.post("/ollama/chat", chatRequest);
    return response.data;
}

export const getSessions = async () => {
    const response= await api.get("/ollama/user-sessions");
    return response.data;
}

export const getMessagesBySession = async (sessionId:string) => {
    const response= await api.get(`/ollama/message/${sessionId}`);
    return response.data;
}

export const updateSessionTitle= async(sessionId: string, title: string ) => {
    const response= await api.put(`/ollama/session-title/${sessionId}`, {
        title: title
    })
    return response.data;
}