export interface DiffPart {
  text: string;
  /** "same" = in both, "removed" = only in the original, "added" = only in the revision. */
  kind: 'same' | 'removed' | 'added';
}

const tokenize = (text: string) => text.split(/(\s+)/).filter((t) => t.length > 0);

/** Word-level diff (longest common subsequence); whitespace tokens are kept so text re-renders as written. */
export function diffWords(original: string, revised: string): DiffPart[] {
  const a = tokenize(original);
  const b = tokenize(revised);
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (kind: DiffPart['kind'], text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.kind === kind) last.text += text;
    else parts.push({ kind, text });
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('removed', a[i++]);
    } else {
      push('added', b[j++]);
    }
  }
  while (i < a.length) push('removed', a[i++]);
  while (j < b.length) push('added', b[j++]);
  return parts;
}
