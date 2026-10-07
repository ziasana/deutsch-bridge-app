import type { VocabularyWordType } from './vocabulary';
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  sessionId: string;
  userId: string;
  content: string;
  role: string;
  /** Set only when this response created a new session: its AI-generated title. */
  sessionTitle?: string | null;
}

export type SelectionType = 'WORD' | 'EXPRESSION';

export interface SelectionClassifyResult {
  type: SelectionType;
  normalizedText: string;
  meaning: string;
  example: string;
  /** Part of speech or expression kind (see VocabularyWordType); null if the model gave none. */
  wordType: VocabularyWordType | null;
  /** Comma-separated synonyms, if the model found any. */
  synonyms: string | null;
}

export interface VocabularyFromChatRequest {
  word: string;
  meaning: string;
  example: string | null;
  sourceChatId: string | null;
  sourceMessageId: string | null;
  level: string | null;
  wordType?: VocabularyWordType | null;
  synonyms?: string | null;
}
