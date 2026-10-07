import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { chatApi, chatVocabularyApi } from '@/api/chatApi';
import { ApiError, toApiError } from '@/api/errors';
import { useRefreshAiUsage } from '@/features/aiUsage/hooks';
import type { ChatMessage, ChatSession } from '@/types/chat';

export const SESSIONS_KEY = ['tutor', 'sessions'] as const;

export const useChatSessions = () =>
  useQuery({ queryKey: SESSIONS_KEY, queryFn: chatApi.sessions, staleTime: 30_000 });

let localId = 0;
const nextId = (suffix: string) => `local-${++localId}-${suffix}`;

/**
 * One conversation at a time: the messages on screen, the active session id ('' = a new chat that
 * has no server session yet) and the in-flight request. The first reply creates the session.
 */
export function useTutorChat() {
  const queryClient = useQueryClient();
  const refreshAiUsage = useRefreshAiUsage();
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [error, setError] = useState<{ error: ApiError; question: string } | null>(null);
  // Guards against a slow response landing in a conversation the learner already left.
  const epoch = useRef(0);

  const reset = useCallback((id: string, list: ChatMessage[]) => {
    epoch.current += 1;
    setSessionId(id);
    setMessages(list);
    setThinking(false);
    setError(null);
  }, []);

  const newChat = useCallback(() => reset('', []), [reset]);

  const select = useCallback(
    async (id: string) => {
      reset(id, []);
      const mine = epoch.current;
      setLoadingSession(true);
      try {
        const data = await queryClient.fetchQuery({
          queryKey: ['tutor', 'messages', id],
          queryFn: () => chatApi.messages(id),
          staleTime: 0,
        });
        if (epoch.current !== mine) return;
        setMessages(
          data
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: m.timestamp,
            })),
        );
      } catch (e) {
        if (epoch.current === mine) setError({ error: toApiError(e), question: '' });
      } finally {
        if (epoch.current === mine) setLoadingSession(false);
      }
    },
    [queryClient, reset],
  );

  const send = useCallback(
    async (question: string, { resend = false }: { resend?: boolean } = {}) => {
      const text = question.trim();
      if (!text || thinking) return;
      const mine = epoch.current;
      if (!resend)
        setMessages((prev) => [...prev, { id: nextId('u'), role: 'user', content: text }]);
      setError(null);
      setThinking(true);
      try {
        const reply = await chatApi.send(text, sessionId);
        if (epoch.current !== mine) return;
        setMessages((prev) => [
          ...prev,
          { id: nextId('a'), role: 'assistant', content: reply.content },
        ]);
        if (reply.sessionId && reply.sessionId !== sessionId) {
          setSessionId(reply.sessionId);
          if (reply.sessionTitle) {
            queryClient.setQueryData<ChatSession[]>(SESSIONS_KEY, (old = []) => [
              {
                id: reply.sessionId,
                userId: '',
                title: reply.sessionTitle as string,
                createdAt: new Date().toISOString(),
              },
              ...old,
            ]);
          } else {
            void queryClient.invalidateQueries({ queryKey: SESSIONS_KEY });
          }
        }
      } catch (e) {
        if (epoch.current === mine) setError({ error: toApiError(e), question: text });
      } finally {
        refreshAiUsage(); // the server counted this request (or refused it) either way
        if (epoch.current === mine) setThinking(false);
      }
    },
    [queryClient, refreshAiUsage, sessionId, thinking],
  );

  const rename = useMutation({
    mutationFn: (title: string) => chatApi.rename(sessionId, title),
    onSuccess: (updated) =>
      queryClient.setQueryData<ChatSession[]>(SESSIONS_KEY, (old = []) =>
        old.map((s) => (s.id === updated.id ? updated : s)),
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => chatApi.remove(id).then(() => id),
    onSuccess: (id) => {
      queryClient.setQueryData<ChatSession[]>(SESSIONS_KEY, (old = []) =>
        old.filter((s) => s.id !== id),
      );
      if (id === sessionId) newChat();
    },
  });

  return {
    sessionId,
    messages,
    thinking,
    loadingSession,
    error,
    send,
    select,
    newChat,
    rename,
    remove,
  };
}

export type SaveOutcome =
  { kind: 'saved'; word: string; meaning: string } | { kind: 'exists'; word: string };

/** Classify → skip duplicates → save a word or phrase from a tutor answer to vocabulary. */
export function useSaveFromChat(sessionId: string | null, messageId: string) {
  return useMutation({
    mutationFn: async ({
      text,
      context,
    }: {
      text: string;
      context: string;
    }): Promise<SaveOutcome> => {
      const classified = await chatVocabularyApi.classify(text.trim(), context);
      const existing = await chatVocabularyApi.exists(classified.normalizedText);
      if (existing.exists) return { kind: 'exists', word: classified.normalizedText };
      await chatVocabularyApi.create({
        word: classified.normalizedText,
        meaning: classified.meaning,
        example: classified.example || null,
        sourceChatId: sessionId,
        sourceMessageId: messageId,
        level: null,
      });
      return { kind: 'saved', word: classified.normalizedText, meaning: classified.meaning };
    },
  });
}
