import type { ChatSession } from '@/types/chat';

export type SessionGroupKey = 'today' | 'yesterday' | 'earlier';
export interface SessionGroup {
  key: SessionGroupKey;
  sessions: ChatSession[];
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Today / Yesterday / Earlier by createdAt, keeping the incoming (newest-first) order inside each group. */
export function groupSessionsByDate(sessions: ChatSession[], now = new Date()): SessionGroup[] {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const buckets: Record<SessionGroupKey, ChatSession[]> = { today: [], yesterday: [], earlier: [] };
  for (const s of sessions) {
    const created = s.createdAt ? new Date(s.createdAt) : null;
    if (created && sameDay(created, now)) buckets.today.push(s);
    else if (created && sameDay(created, yesterday)) buckets.yesterday.push(s);
    else buckets.earlier.push(s);
  }
  return (['today', 'yesterday', 'earlier'] as const)
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, sessions: buckets[k] }));
}

/** Titles and descriptions come from the dictionary (`tutor.starters`); prompts go to the tutor in German. */
export const STARTERS = [
  {
    key: 'speaking',
    emoji: '💬',
    prompt: 'Lass uns auf Deutsch über meinen Alltag sprechen. Stell mir Fragen dazu.',
  },
  {
    key: 'writing',
    emoji: '✍️',
    prompt: 'Ich möchte meine deutschen Schreibfähigkeiten üben. Gib mir ein Thema zum Schreiben.',
  },
  {
    key: 'grammar',
    emoji: '📖',
    prompt: 'Kannst du mir helfen, deutsche Grammatik zu üben? Erkläre mir etwas und teste mich.',
  },
  {
    key: 'question',
    emoji: '❓',
    prompt: 'Ich habe eine Frage zum Deutschlernen.',
  },
] as const;
