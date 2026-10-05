import { allLearned, firstUnlearnedIndex, learnedCount, nextIndex, splitSynonyms } from '../flow';
import { resultTitle } from '@/utils/feedback';
import { buildQuestions, shuffle } from '../practice';
import { makeWords } from '../testing/fixtures';

describe('flow helpers', () => {
  it('starts on the first unlearned word', () => {
    expect(firstUnlearnedIndex(makeWords([true, true, false, false, false]))).toBe(2);
    expect(firstUnlearnedIndex(makeWords([true, true, true, true, true]))).toBe(0);
  });

  it('advances to the next unlearned word, then the next word, then ends', () => {
    expect(nextIndex(makeWords([false, false, true, false, false]), 1)).toBe(3);
    expect(nextIndex(makeWords([false, false, true, true, true]), 1)).toBe(2);
    expect(nextIndex(makeWords([true, true, true, true, true]), 4)).toBeNull();
  });

  it('counts learned words and detects completion', () => {
    const w = makeWords([true, true, false, false, false]);
    expect(learnedCount(w)).toBe(2);
    expect(allLearned(w)).toBe(false);
    expect(allLearned(makeWords([true, true, true, true, true]))).toBe(true);
    expect(allLearned([])).toBe(false);
  });

  it('splits synonyms on commas and semicolons', () => {
    expect(splitSynonyms('a, b; c ')).toEqual(['a', 'b', 'c']);
    expect(splitSynonyms(null)).toEqual([]);
  });

  it('also splits AI-style synonyms given one per line, bulleted or numbered', () => {
    expect(splitSynonyms('Bushalt\nHaltestelle\n- Busstopp\n3. Busstation')).toEqual([
      'Bushalt',
      'Haltestelle',
      'Busstopp',
      'Busstation',
    ]);
  });
});

describe('quiz', () => {
  const words = makeWords();

  it('builds one question per word whose options include the answer plus distractors from other words', () => {
    const questions = buildQuestions(words, false, () => 0.3);
    expect(questions).toHaveLength(5);
    for (const q of questions) {
      expect(q.options).toContain(q.answer);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options.every((o) => words.some((w) => w.word === o))).toBe(true);
    }
  });

  it('uses the Persian meaning only when preferred and provided', () => {
    const fa = words.map((w, i) => (i === 0 ? { ...w, meaningFa: 'معنی' } : w));
    const prompts = (preferPersian: boolean) =>
      buildQuestions(fa, preferPersian, () => 0.1).map((q) => q.prompt);
    expect(prompts(true)).toContain('معنی');
    expect(prompts(false)).not.toContain('معنی');
    expect(prompts(true)).toContain(`meaning of ${words[1].word}`); // falls back per word
  });

  it('handles fewer than four words', () => {
    const q = buildQuestions(makeWords().slice(0, 2));
    expect(q.every((x) => x.options.length === 2)).toBe(true);
  });

  it('shuffle keeps all items without mutating the input', () => {
    const input = [1, 2, 3, 4];
    expect(shuffle(input).sort()).toEqual([1, 2, 3, 4]);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it('titles results encouragingly', () => {
    expect(resultTitle(5, 5)).toBe('Sehr gut!');
    expect(resultTitle(3, 5)).toBe('Gut gemacht!');
    expect(resultTitle(1, 5)).toBe('Weiter so!');
  });
});
