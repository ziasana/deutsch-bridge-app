import type {
  Annotation,
  ArticleToken,
  ReadingArticle,
  ReadingArticleSummary,
} from '@/types/reading';

/** Tokenizes like the backend: runs of letters are words, everything else is its own token. */
export function tokenize(content: string): ArticleToken[] {
  const out: ArticleToken[] = [];
  const re = /[\p{L}\p{N}]+|[^\p{L}\p{N}]/gu;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(content))) {
    const isWord = /[\p{L}\p{N}]/u.test(m[0]);
    out.push({ index: i++, text: m[0], lemma: m[0].toLowerCase(), pos: null, isWord });
  }
  return out;
}

export const annotation = (
  over: Partial<Annotation> & { spans: Annotation['spans'] },
): Annotation => ({
  id: 'a1',
  surfaceText: '',
  type: 'WORD',
  lemma: 'Lemma',
  pos: null,
  gender: null,
  pluralForm: null,
  translationEn: 'translation',
  literalTranslation: null,
  cefrLevel: 'B1',
  exampleSentence: null,
  known: false,
  ...over,
});

export const CONTENT = 'Der Hund bellt laut. Er hat Hunger und steht auf dem Schlauch.';

export const makeArticle = (over: Partial<ReadingArticle> = {}): ReadingArticle => ({
  id: 'r1',
  title: 'Ein Tag im Park',
  categoryId: 'c1',
  categoryTitle: 'Alltag',
  level: 'B1',
  content: CONTENT,
  imageUrl: null,
  thumbnailUrl: null,
  viewCount: 12,
  createdAt: '2026-01-05T10:00:00Z',
  keyVocabulary: [
    { word: 'bellen', meaning: 'to bark' },
    { word: 'Hunger', meaning: 'hunger' },
  ],
  annotations: [
    annotation({
      id: 'a1',
      spans: [{ start: 4, end: 8 }],
      surfaceText: 'Hund',
      lemma: 'Hund',
      gender: 'der',
      pluralForm: 'Hunde',
      translationEn: 'dog',
    }),
    annotation({
      id: 'a2',
      spans: [{ start: 45, end: 61 }],
      surfaceText: 'auf dem Schlauch',
      type: 'REDEWENDUNG',
      lemma: 'auf dem Schlauch stehen',
      literalTranslation: 'to stand on the hose',
      translationEn: 'to not get it',
    }),
  ],
  newWordCount: 2,
  tokens: tokenize(CONTENT),
  learningProgresses: [],
  bookmarked: false,
  quizCompleted: false,
  ...over,
});

export const makeSummary = (
  n: number,
  over: Partial<ReadingArticleSummary> = {},
): ReadingArticleSummary => ({
  id: `r${n}`,
  title: `Artikel ${n}`,
  categoryId: 'c1',
  categoryTitle: 'Alltag',
  level: 'B1',
  imageUrl: null,
  thumbnailUrl: null,
  viewCount: n,
  createdAt: '2026-01-05T10:00:00Z',
  newWordCount: 3,
  learned: false,
  bookmarked: false,
  ...over,
});
