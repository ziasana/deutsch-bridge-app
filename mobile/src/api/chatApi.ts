import type {
  ChatMessage,
  ChatResponse,
  ChatSession,
  SelectionClassifyResult,
  VocabularyFromChatRequest,
} from '@/types/chat';
import { api } from './client';

export const chatApi = {
  /** Counts against the daily AI chat limit (429); slow, so it waits up to the AI timeout. */
  send: (question: string, sessionId: string) =>
    api.postAi<ChatResponse>('/ollama/chat', { question, sessionId: sessionId || undefined }),
  sessions: () => api.get<ChatSession[]>('/ollama/user-sessions'),
  messages: (sessionId: string) => api.get<(Omit<ChatMessage, 'role'> & { role: string })[]>(`/ollama/message/${sessionId}`),
  rename: (sessionId: string, title: string) =>
    api.put<ChatSession>(`/ollama/session-title/${sessionId}`, { title }),
  remove: (sessionId: string) => api.delete<void>(`/ollama/session/${sessionId}`),
};

/** Saving a word or phrase from a tutor answer to the learner's vocabulary. */
export const chatVocabularyApi = {
  classify: (selectedText: string, contextText: string) =>
    api.postAi<SelectionClassifyResult>('/vocabulary/classify-selection', { selectedText, contextText }),
  exists: (word: string) =>
    api.get<{ exists: boolean; vocabularyItemId: string | null }>('/vocabulary/exists', { word }),
  create: (request: VocabularyFromChatRequest) => api.post<unknown>('/vocabulary/from-chat', request),
};
