import { nextSelection, splitWords } from '../WordTap';

describe('splitWords', () => {
  it('separates words from punctuation and keeps every character', () => {
    const parts = splitWords('Das ist, äh, schön!');
    expect(parts.filter((p) => p.word).map((p) => p.text)).toEqual(['Das', 'ist', 'äh', 'schön']);
    expect(parts.map((p) => p.text).join('')).toBe('Das ist, äh, schön!');
  });

  it('keeps inner hyphens and apostrophes but not trailing ones', () => {
    expect(
      splitWords('E-Mail- geht’s')
        .filter((p) => p.word)
        .map((p) => p.text),
    ).toEqual(['E-Mail', 'geht’s']);
  });

  it('handles Persian words', () => {
    expect(splitWords('سلام دنیا').filter((p) => p.word)).toHaveLength(2);
  });
});

describe('nextSelection', () => {
  const words = ['a', 'b', 'c', 'd', 'e'];

  it('starts with the tapped word', () => {
    expect(nextSelection(null, 's', 2, words)).toEqual({ scope: 's', from: 2, to: 2, text: 'c' });
  });

  it('extends to either side', () => {
    const one = nextSelection(null, 's', 2, words);
    expect(nextSelection(one, 's', 3, words)).toMatchObject({ from: 2, to: 3, text: 'c d' });
    expect(nextSelection(one, 's', 1, words)).toMatchObject({ from: 1, to: 2, text: 'b c' });
  });

  it('shrinks from the ends and clears a lone word', () => {
    const run = nextSelection(nextSelection(null, 's', 1, words), 's', 2, words);
    expect(nextSelection(run, 's', 1, words)).toMatchObject({ from: 2, to: 2, text: 'c' });
    expect(nextSelection(run, 's', 2, words)).toMatchObject({ from: 1, to: 1, text: 'b' });
    expect(nextSelection({ scope: 's', from: 2, to: 2, text: 'c' }, 's', 2, words)).toBeNull();
  });

  it('starts over for a distant word or another paragraph', () => {
    const one = nextSelection(null, 's', 0, words);
    expect(nextSelection(one, 's', 4, words)).toMatchObject({ from: 4, to: 4 });
    expect(nextSelection(one, 'other', 1, words)).toMatchObject({ scope: 'other', from: 1 });
  });
});
