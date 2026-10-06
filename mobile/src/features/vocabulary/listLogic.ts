import type { VocabularyItem, VocabularyMasteryLevel, VocabularySource } from '@/types/vocabulary';

export const MASTERY_ORDER: VocabularyMasteryLevel[] = ['NEW', 'LEARNING', 'FAMILIAR', 'MASTERED'];

/** Colour per mastery step: grey → amber → blue → green. */
export const MASTERY_COLOR: Record<VocabularyMasteryLevel, string> = {
  NEW: '#9AA3B5',
  LEARNING: '#D98E04',
  FAMILIAR: '#4D94FF',
  MASTERED: '#27AE7A',
};

export const SOURCE_LABEL: Record<VocabularySource, string> = {
  CUSTOM: 'Meine Wörter',
  DICTIONARY: 'Aus dem Lesen',
  AI_TUTOR: 'Aus dem KI-Tutor',
};

export const SOURCE_ICON = {
  CUSTOM: 'create-outline',
  DICTIONARY: 'book-outline',
  AI_TUTOR: 'sparkles-outline',
} as const;

export const SOURCES: VocabularySource[] = ['CUSTOM', 'DICTIONARY', 'AI_TUTOR'];

export const masteryOf = (item: VocabularyItem): VocabularyMasteryLevel =>
  item.progress?.masteryLevel ?? 'NEW';

export const wordLabel = (item: Pick<VocabularyItem, 'article' | 'word'>) =>
  item.article ? `${item.article} ${item.word}` : item.word;

export function masteryCounts(items: VocabularyItem[]): Record<VocabularyMasteryLevel, number> {
  const counts = { NEW: 0, LEARNING: 0, FAMILIAR: 0, MASTERED: 0 };
  for (const i of items) counts[masteryOf(i)] += 1;
  return counts;
}

export function sourceCounts(items: VocabularyItem[]): Record<VocabularySource, number> {
  const counts = { CUSTOM: 0, DICTIONARY: 0, AI_TUTOR: 0 };
  for (const i of items) counts[i.source] += 1;
  return counts;
}

const PRIORITY: Record<VocabularyMasteryLevel, number> = {
  LEARNING: 0,
  FAMILIAR: 1,
  NEW: 2,
  MASTERED: 3,
};

/** The words to work on next: started ones first, weakest first; mastered words are done. */
export function continueLearning(items: VocabularyItem[], limit = 3) {
  const candidates = items.filter((i) => masteryOf(i) !== 'MASTERED');
  const sorted = [...candidates].sort((a, b) => {
    const diff = PRIORITY[masteryOf(a)] - PRIORITY[masteryOf(b)];
    return diff !== 0 ? diff : (a.progress?.overallScore ?? 0) - (b.progress?.overallScore ?? 0);
  });
  return { list: sorted.slice(0, limit), readyCount: candidates.length };
}

export type VocabularyFilters = {
  search: string;
  mastery: VocabularyMasteryLevel | 'ALL';
  bookmarkedOnly: boolean;
};

export function filterWords(items: VocabularyItem[], f: VocabularyFilters): VocabularyItem[] {
  const term = f.search.trim().toLowerCase();
  return items.filter((i) => {
    if (f.mastery !== 'ALL' && masteryOf(i) !== f.mastery) return false;
    if (f.bookmarkedOnly && !i.bookmarked) return false;
    if (!term) return true;
    return (
      i.word.toLowerCase().includes(term) ||
      i.meaning.toLowerCase().includes(term) ||
      (i.example ?? '').toLowerCase().includes(term)
    );
  });
}

export const ARTICLE_COLOR: Record<string, string> = {
  der: '#4D94FF',
  die: '#E8587A',
  das: '#27AE7A',
};
