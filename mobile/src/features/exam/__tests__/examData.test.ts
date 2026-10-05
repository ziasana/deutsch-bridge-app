import {
  averageScore,
  effectiveScore,
  exercisesForSectionAndLevel,
  findContinueTarget,
  findGroupByKey,
  groupIntoParts,
  masteredCount,
} from '../examData';
import { isEmptyTranscript, optionLabelFor, withGapMarkers } from '../content';
import { summary } from '../testing/fixtures';

describe('scores', () => {
  it('uses the last score, or full credit for completed items without one', () => {
    expect(effectiveScore(summary('a', { lastScore: 60 }))).toBe(60);
    expect(effectiveScore(summary('a', { completed: true }))).toBe(100);
    expect(effectiveScore(summary('a'))).toBe(0);
    const items = [summary('a', { lastScore: 100 }), summary('b', { lastScore: 50 })];
    expect(averageScore(items)).toBe(75);
    expect(averageScore([])).toBe(0);
    expect(masteredCount(items)).toBe(1);
  });
});

describe('groupIntoParts', () => {
  it('groups Lesen by part number with task-type labels, sorted naturally by title', () => {
    const items = [
      summary('c', { partNumber: 2, taskType: 'MULTIPLE_CHOICE', title: '2. Übung' }),
      summary('a', { partNumber: 1, taskType: 'MATCHING', title: '10. Übung' }),
      summary('b', { partNumber: 1, taskType: 'MATCHING', title: '2. Übung' }),
    ];
    const groups = groupIntoParts(items, 'LESEVERSTEHEN');
    expect(groups.map((g) => g.label)).toEqual([
      'Teil 1 – Zuordnungsaufgaben',
      'Teil 2 – Multiple-Choice-Aufgaben',
    ]);
    expect(groups[0].items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('orders Sprachbausteine MC before cloze and tracks state', () => {
    const items = [
      summary('a', { section: 'SPRACHBAUSTEINE', taskType: 'WORD_BANK_CLOZE', lastScore: 100, completed: true }),
      summary('b', { section: 'SPRACHBAUSTEINE', taskType: 'MULTIPLE_CHOICE', completed: true, lastScore: 40 }),
      summary('c', { section: 'SPRACHBAUSTEINE', taskType: 'MULTIPLE_CHOICE' }),
    ];
    const groups = groupIntoParts(items, 'SPRACHBAUSTEINE');
    expect(groups.map((g) => [g.heading, g.state])).toEqual([
      ['Teil 1', 'in_progress'],
      ['Teil 2', 'completed'],
    ]);
  });

  it('finds a group by key and treats level-less exercises as every level', () => {
    const items = [
      summary('a', { partNumber: 1 }),
      summary('b', { partNumber: 1, level: 'A2' }),
      summary('c', { partNumber: 1, level: null }),
    ];
    expect(exercisesForSectionAndLevel(items, 'LESEVERSTEHEN', 'B1').map((i) => i.id)).toEqual(['a', 'c']);
    expect(findGroupByKey(items, 'LESEVERSTEHEN', 'B1', '1')?.total).toBe(2);
    expect(findGroupByKey(items, 'LESEVERSTEHEN', 'B1', '9')).toBeNull();
  });
});

describe('findContinueTarget', () => {
  it('prefers the most advanced in-progress Teil of the chosen section', () => {
    const items = [
      summary('a', { partNumber: 1, lastScore: 100, completed: true }),
      summary('b', { partNumber: 1 }),
      summary('c', { partNumber: 2, lastScore: 30, completed: true }),
      summary('d', { partNumber: 2 }),
    ];
    const target = findContinueTarget(items, 'B1', 'LESEVERSTEHEN');
    expect(target?.exerciseId).toBe('b'); // Teil 1 averages 50 vs Teil 2's 15
  });

  it('falls back to another section, then to review of the last Teil', () => {
    const lesenDone = summary('a', { lastScore: 100, completed: true });
    const hoeren = summary('h', { section: 'HOERVERSTEHEN', taskType: 'TRUE_FALSE_NOT_GIVEN' });
    expect(findContinueTarget([lesenDone, hoeren], 'B1', 'LESEVERSTEHEN')?.section).toBe('HOERVERSTEHEN');
    expect(findContinueTarget([lesenDone], 'B1', 'LESEVERSTEHEN')?.state).toBe('completed');
    expect(findContinueTarget([], 'B1', 'LESEVERSTEHEN')).toBeNull();
    expect(findContinueTarget([lesenDone], 'B1', 'SCHRIFTLICHER_AUSDRUCK')?.section).toBe('LESEVERSTEHEN');
  });
});

describe('content helpers', () => {
  it('turns gap spans into bold numbers', () => {
    expect(withGapMarkers('Ich <span data-exam-gap="3" class="x">3</span> gern')).toBe('Ich **(3)** gern');
  });
  it('detects empty transcripts', () => {
    expect(isEmptyTranscript(null)).toBe(true);
    expect(isEmptyTranscript('<p></p>')).toBe(true);
    expect(isEmptyTranscript('<p>Hallo</p>')).toBe(false);
  });
  it('labels answer-pool entries', () => {
    expect(optionLabelFor(['', '1'], 0)).toBe('a');
    expect(optionLabelFor(['', '1'], 1)).toBe('1');
    expect(optionLabelFor(null, 2)).toBe('c');
  });
});
