import { dictionaries } from '@/i18n';
import { toMobileHref } from '../routes';
import {
  continueCopy,
  focusCopy,
  getMode,
  greeting,
  headline,
  reviewSummary,
  statusMessage,
  weekDays,
} from '../viewModel';
import { baseDashboard, withOverrides } from '../testing/fixtures';

const H = dictionaries.en.home;

describe('getMode / statusMessage', () => {
  it('new learner when the backend recommends START', () => {
    const d = withOverrides({
      continueLearning: { ...baseDashboard.continueLearning, type: 'START', progressPercent: null },
    });
    expect(getMode(d)).toBe('new');
    expect(headline(d, 9, H)).toBe('Welcome 👋');
    expect(statusMessage(d, H)).toContain('learning routine');
  });

  it('a never-studied account is "new" even though the backend counts an empty review as done', () => {
    const d = withOverrides({
      currentStreak: 0,
      week: { days: Array(7).fill(false), learningDays: 0, totalDays: 7 },
      continueLearning: {
        type: 'DAILY_WORDS',
        title: null,
        progressPercent: 0,
        completed: 0,
        total: 5,
        route: '/dashboard/daily-words',
      },
      today: { ...baseDashboard.today, completed: 1, total: 4 },
    });
    expect(getMode(d)).toBe('new');
    expect(statusMessage(d, H)).toContain('learning routine');
    expect(continueCopy(d.continueLearning, H, true).title).toBe('Learn your first 5 words');
  });

  it('exam-focused learner', () => {
    const d = withOverrides({
      continueLearning: {
        ...baseDashboard.continueLearning,
        type: 'EXAM',
        title: 'Lesen – Teil 2',
      },
    });
    expect(getMode(d)).toBe('exam');
    expect(statusMessage(d, H)).toBe('Your current focus: Lesen – Teil 2');
  });

  it('unfinished plan', () => {
    const d = withOverrides({ today: { ...baseDashboard.today, completed: 2, total: 4 } });
    expect(getMode(d)).toBe('planInProgress');
    expect(statusMessage(d, H)).toBe(
      "You're already halfway through today. 2 of 4 activities completed.",
    );
    expect(
      statusMessage(
        withOverrides({ today: { ...baseDashboard.today, completed: 1, total: 4 } }),
        H,
      ),
    ).toContain('already started');
  });

  it('returning learner with reviews due', () => {
    const d = withOverrides({ review: { wordsDue: 8, expressionsDue: 3 } });
    expect(getMode(d)).toBe('reviewDue');
    expect(headline(d, 9, H)).toBe('Welcome back 👋');
    expect(statusMessage(d, H)).toBe('8 words · 3 expressions waiting for review.');
  });

  it('default state greets by time of day', () => {
    expect(getMode(baseDashboard)).toBe('default');
    expect(headline(baseDashboard, 8, H)).toBe('Good morning, Ali 👋');
    expect(greeting(14, H)).toBe('Good afternoon');
    expect(greeting(20, H)).toBe('Good evening');
  });
});

describe('copy helpers', () => {
  it('pluralizes review summary', () => {
    expect(reviewSummary(1, 0, H)).toBe('1 word');
    expect(reviewSummary(0, 1, H)).toBe('1 expression');
    expect(reviewSummary(2, 2, H)).toBe('2 words · 2 expressions');
  });

  it('uses the backend title and counts, never invented numbers', () => {
    expect(continueCopy(baseDashboard.continueLearning, H).title).toBe('Perfekt');
    expect(
      continueCopy({ ...baseDashboard.continueLearning, type: 'VOCAB_REVIEW', total: 8 }, H)
        .description,
    ).toBe('8 words are waiting for you.');
  });

  it('focus is encouraging, null when nothing to suggest', () => {
    expect(focusCopy({ area: 'VOCABULARY', route: null }, H)?.area).toBe('Vocabulary');
    expect(focusCopy({ area: 'WRITING', route: null, detail: 'FORM' }, H)?.text).toContain(
      'form and salutation',
    );
    expect(focusCopy({ area: null, route: null }, H)).toBeNull();
    expect(JSON.stringify(focusCopy({ area: 'GRAMMAR', route: null }, H))).not.toMatch(
      /schwäch|weak/i,
    );
  });

  it('maps the rolling 7-day window oldest → today', () => {
    const today = new Date(2026, 9, 7); // Wednesday
    const days = weekDays([true, false, false, false, false, false, true], today, H);
    expect(days[6]).toEqual({ label: 'We', learned: true, isToday: true });
    expect(days[0].label).toBe('Th');
  });
});

describe('toMobileHref', () => {
  it.each([
    ['/dashboard/daily-words', '/learn/daily-words'],
    ['/dashboard/vocabulary/practice', '/learn/vocabulary'],
    ['/dashboard/grammar', '/learn/grammar'],
    ['/dashboard/reading/article?id=9', '/learn/reading'],
    ['/dashboard/expressions', '/learn/expressions'],
    ['/dashboard/exam-prep/schreiben/fortschritt', '/exam'],
    ['/dashboard', '/home'],
  ])('%s → %s', (web, mobile) => expect(toMobileHref(web)).toBe(mobile));

  it('deep-links a grammar lesson by id', () => {
    expect(toMobileHref('/dashboard/grammar/lesson?id=abc')).toEqual({
      pathname: '/grammar/[lessonId]',
      params: { lessonId: 'abc' },
    });
    expect(toMobileHref('/dashboard/grammar/lesson')).toBe('/learn/grammar');
  });

  it('deep-links an exam exercise by id', () => {
    expect(toMobileHref('/dashboard/exam-prep/exercise?id=e9')).toEqual({
      pathname: '/exam-prep/exercise/[exerciseId]',
      params: { exerciseId: 'e9' },
    });
    expect(toMobileHref('/dashboard/exam-prep?section=HOERVERSTEHEN')).toBe('/exam');
  });

  it('falls back safely for unknown or missing routes', () => {
    expect(toMobileHref('/something/else')).toBe('/learn');
    expect(toMobileHref(null)).toBe('/learn');
    expect(toMobileHref(undefined, '/home')).toBe('/home');
  });
});
