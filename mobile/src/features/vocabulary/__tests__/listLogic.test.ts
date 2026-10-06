import {
  continueLearning,
  filterWords,
  masteryCounts,
  masteryOf,
  sourceCounts,
  wordLabel,
} from '../listLogic';
import { makeWord } from '../testing/fixtures';

const progress = (masteryLevel: 'LEARNING' | 'FAMILIAR' | 'MASTERED', overallScore = 10) => ({
  recallScore: 0,
  contextScore: 0,
  overallScore,
  reviewCount: 1,
  correctCount: 1,
  incorrectCount: 0,
  masteryLevel,
  lastReviewedAt: null,
  nextReviewAt: null,
});

const words = [
  makeWord(1),
  makeWord(2, { progress: progress('LEARNING', 20), bookmarked: true, article: 'der' }),
  makeWord(3, { progress: progress('LEARNING', 5) }),
  makeWord(4, { progress: progress('MASTERED', 100), source: 'DICTIONARY' }),
  makeWord(5, { progress: progress('FAMILIAR'), example: 'Ein Beispiel mit Hund.' }),
];

describe('vocabulary list logic', () => {
  it('treats words without progress as new', () => {
    expect(masteryOf(words[0])).toBe('NEW');
    expect(masteryCounts(words)).toEqual({ NEW: 1, LEARNING: 2, FAMILIAR: 1, MASTERED: 1 });
  });

  it('counts words per source', () => {
    expect(sourceCounts(words)).toEqual({ CUSTOM: 4, DICTIONARY: 1, AI_TUTOR: 0 });
  });

  it('puts the weakest started words first and leaves mastered ones out', () => {
    const { list, readyCount } = continueLearning(words);
    expect(readyCount).toBe(4);
    expect(list.map((w) => w.id)).toEqual(['w3', 'w2', 'w5']);
  });

  it('filters by mastery, bookmark and search (word, meaning, example)', () => {
    const base = { search: '', mastery: 'ALL' as const, bookmarkedOnly: false };
    expect(filterWords(words, { ...base, mastery: 'LEARNING' }).map((w) => w.id)).toEqual([
      'w2',
      'w3',
    ]);
    expect(filterWords(words, { ...base, bookmarkedOnly: true }).map((w) => w.id)).toEqual(['w2']);
    expect(filterWords(words, { ...base, search: ' HUND ' }).map((w) => w.id)).toEqual(['w5']);
    expect(filterWords(words, { ...base, search: 'meaning 3' }).map((w) => w.id)).toEqual(['w3']);
  });

  it('shows the article in front of the word', () => {
    expect(wordLabel({ article: 'der', word: 'Hund' })).toBe('der Hund');
    expect(wordLabel({ article: null, word: 'laufen' })).toBe('laufen');
  });
});
