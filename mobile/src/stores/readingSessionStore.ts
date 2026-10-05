import { create } from 'zustand';

/**
 * What the learner tapped/saved while reading an article. The reader and the quiz are separate
 * screens, and completing the quiz reports both sets to the backend (it uses them to judge vocabulary).
 */
type ReadingSessionState = {
  articleId: string | null;
  tapped: string[];
  saved: string[];
  start: (articleId: string) => void;
  tap: (lemma: string) => void;
  save: (lemma: string) => void;
};

const add = (list: string[], v: string) => (list.includes(v) ? list : [...list, v]);

export const useReadingSessionStore = create<ReadingSessionState>((set) => ({
  articleId: null,
  tapped: [],
  saved: [],
  // Re-opening the same article keeps its taps; a different article starts clean.
  start: (articleId) =>
    set((s) => (s.articleId === articleId ? s : { articleId, tapped: [], saved: [] })),
  tap: (lemma) => set((s) => ({ tapped: add(s.tapped, lemma) })),
  save: (lemma) => set((s) => ({ saved: add(s.saved, lemma) })),
}));
