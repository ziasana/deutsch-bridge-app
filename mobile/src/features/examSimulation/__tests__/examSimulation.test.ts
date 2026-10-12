import type { AnswerMap, PartResult, PartState } from '@/types/examSimulation';
import { countWords, formatClock, formatPoints } from '../format';
import { countAnswered, partItems } from '../run/partItems';
import { sectionShares } from '../ResultScreen';

const part = (over: Partial<PartState>): PartState => ({
  key: 'p',
  label: 'Teil',
  module: 'WRITTEN',
  section: 'LESEVERSTEHEN',
  teil: 1,
  maxPoints: 25,
  scoringMethod: 'PER_QUESTION',
  previewOnly: false,
  maxAudioPlays: null,
  audioPlays: {},
  exercises: [],
  ...over,
});

const question = (id: string, questionNumber: number | null = null) => ({
  id,
  taskType: 'MULTIPLE_CHOICE' as const,
  prompt: id,
  sectionIndex: null,
  options: ['a', 'b'],
  gapNumber: null,
  questionNumber,
});

const exercise = (ids: string[]) => ({
  ordinal: 1,
  title: 'E',
  taskType: 'MULTIPLE_CHOICE' as const,
  teilDescription: null,
  passages: [],
  questions: ids.map((id) => question(id)),
  answerOptions: null,
  answerOptionLabels: null,
  requiresPlanning: false,
  leitpunkte: null,
  speaking: null,
});

describe('formatting', () => {
  it('uses the German decimal comma and at most one decimal', () => {
    expect(formatPoints(7.5)).toBe('7,5');
    expect(formatPoints(25)).toBe('25');
    expect(formatPoints(7.25)).toBe('7,3');
    expect(formatPoints(null)).toBe('–');
  });

  it('formats the clock with hours only when needed', () => {
    expect(formatClock(59)).toBe('0:59');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('counts words', () => {
    expect(countWords('  ')).toBe(0);
    expect(countWords('Liebe  Anna, \n danke')).toBe(3);
  });
});

describe('partItems', () => {
  it('lists the questions of an objective part, numbered by position', () => {
    const p = part({ exercises: [exercise(['q1', 'q2']), exercise(['q3'])] });
    expect(partItems(p).map((i) => i.label)).toEqual(['1', '2', '3']);
  });

  it('uses one pseudo item for writing and oral parts', () => {
    expect(partItems(part({ section: 'SCHRIFTLICHER_AUSDRUCK' }))[0].id).toBe('__text');
    expect(partItems(part({ module: 'ORAL', section: 'MUENDLICHER_AUSDRUCK' }))[0].id).toBe('__done');
  });

  it('counts only non-blank answers', () => {
    const p = part({ exercises: [exercise(['q1', 'q2', 'q3'])] });
    const answers: AnswerMap = {
      p: { q1: { answer: 'a', flagged: false }, q2: { answer: '  ', flagged: true }, q3: { answer: null, flagged: false } },
    };
    expect(countAnswered(p, answers)).toBe(1);
  });
});

describe('sectionShares', () => {
  const result = (over: Partial<PartResult>): PartResult => ({
    key: 'k',
    label: 'L',
    module: 'WRITTEN',
    section: 'LESEVERSTEHEN',
    teil: 1,
    method: 'PER_QUESTION',
    maxPoints: 25,
    score: 20,
    status: 'SCORED',
    totalQuestions: 5,
    correct: 4,
    incorrect: 1,
    unanswered: 0,
    completed: true,
    criteriaScores: null,
    assessorComment: null,
    ...over,
  });

  it('sums the scored written parts per section and skips the rest', () => {
    const shares = sectionShares([
      result({ key: 'a', score: 20 }),
      result({ key: 'b', score: 10 }),
      result({ key: 'c', section: 'SCHRIFTLICHER_AUSDRUCK', status: 'AWAITING_ASSESSMENT', score: null }),
      result({ key: 'd', module: 'ORAL', section: 'MUENDLICHER_AUSDRUCK', status: 'NOT_SCORED', score: null }),
    ]);
    expect(shares).toEqual([{ section: 'LESEVERSTEHEN', label: 'Leseverstehen', percent: 60 }]);
  });
});
