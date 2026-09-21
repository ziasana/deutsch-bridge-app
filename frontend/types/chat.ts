export interface ChatResponse {
    sessionId: string
    userId: string
    content: string
    role: string
    /** Set only when this response created a new session - the AI-generated title for it. */
    sessionTitle?: string | null
}

export type ChatRequest= {
    question: string,
    sessionId?: string
}

export type ChatMessage ={
  id: string;
  sessionId?: string;
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
}

export type ChatSessionDto = {
  id: string,
  userId: string,
  title: string,
  createdAt?: string
}