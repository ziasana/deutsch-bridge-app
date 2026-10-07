import { createContext } from 'react';

/** A run of adjacent words picked inside one paragraph (`scope`), by word position. */
export type WordSelection = { scope: string; from: number; to: number; text: string };

export type WordTapConfig = {
  selection: WordSelection | null;
  /** `words` is every tappable word of the paragraph, in order, so a phrase can be built from it. */
  onTap: (scope: string, index: number, words: string[]) => void;
};

/** When set, plain words in the content become tappable (used by the AI Tutor chat). */
export const WordTapContext = createContext<WordTapConfig | null>(null);

// Letters of German (with umlauts / ß) and Persian, plus inner apostrophes and hyphens.
const WORD = /[A-Za-zÀ-ÖØ-öø-ÿĀ-žẞ؀-ۿ][A-Za-zÀ-ÖØ-öø-ÿĀ-žẞ؀-ۿ'’-]*/g;

export type TextPart = { text: string; word: boolean };

/** Splits text into words and the separators between them, keeping every character. */
export function splitWords(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(WORD)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), word: false });
    // A trailing hyphen/apostrophe belongs to punctuation, not the word.
    const word = m[0].replace(/['’-]+$/, '');
    parts.push({ text: word, word: true });
    if (word.length < m[0].length) parts.push({ text: m[0].slice(word.length), word: false });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), word: false });
  return parts;
}

/** The selection after tapping word `index`: extends an adjacent run, toggles a lone word, else starts over. */
export function nextSelection(
  current: WordSelection | null,
  scope: string,
  index: number,
  words: string[],
): WordSelection | null {
  const single = { scope, from: index, to: index, text: words[index] };
  if (!current || current.scope !== scope) return single;
  const { from, to } = current;
  if (index >= from && index <= to) {
    // Tapping the ends shrinks the phrase; tapping the only word clears it.
    if (from === to) return null;
    const range = index === from ? [from + 1, to] : index === to ? [from, to - 1] : [index, index];
    return {
      scope,
      from: range[0],
      to: range[1],
      text: words.slice(range[0], range[1] + 1).join(' '),
    };
  }
  if (index === to + 1)
    return { scope, from, to: index, text: words.slice(from, index + 1).join(' ') };
  if (index === from - 1)
    return { scope, from: index, to, text: words.slice(index, to + 1).join(' ') };
  return single;
}
