import { toMobileHref } from '../routes';
import { continueCopy, focusCopy, getMode, greeting, headline, reviewSummary, statusMessage, weekDays } from '../viewModel';
import { baseDashboard, withOverrides } from '../testing/fixtures';

describe('getMode / statusMessage', () => {
  it('new learner when the backend recommends START', () => {
    const d = withOverrides({ continueLearning: { ...baseDashboard.continueLearning, type: 'START', progressPercent: null } });
    expect(getMode(d)).toBe('new');
    expect(headline(d, 9)).toBe('Willkommen 👋');
    expect(statusMessage(d)).toContain('Lernroutine');
  });

  it('exam-focused learner', () => {
    const d = withOverrides({ continueLearning: { ...baseDashboard.continueLearning, type: 'EXAM', title: 'Lesen – Teil 2' } });
    expect(getMode(d)).toBe('exam');
    expect(statusMessage(d)).toBe('Dein aktueller Fokus: Lesen – Teil 2');
  });

  it('unfinished plan', () => {
    const d = withOverrides({ today: { ...baseDashboard.today, completed: 2, total: 4 } });
    expect(getMode(d)).toBe('planInProgress');
    expect(statusMessage(d)).toBe('Du bist heute schon halb fertig. 2 von 4 Aktivitäten abgeschlossen.');
    expect(statusMessage(withOverrides({ today: { ...baseDashboard.today, completed: 1, total: 4 } }))).toContain('schon angefangen');
  });

  it('returning learner with reviews due', () => {
    const d = withOverrides({ review: { wordsDue: 8, expressionsDue: 3 } });
    expect(getMode(d)).toBe('reviewDue');
    expect(headline(d, 9)).toBe('Willkommen zurück 👋');
    expect(statusMessage(d)).toBe('8 Wörter · 3 Redewendungen warten auf Wiederholung.');
  });

  it('default state greets by time of day', () => {
    expect(getMode(baseDashboard)).toBe('default');
    expect(headline(baseDashboard, 8)).toBe('Guten Morgen, Ali 👋');
    expect(greeting(14)).toBe('Guten Tag');
    expect(greeting(20)).toBe('Guten Abend');
  });
});

describe('copy helpers', () => {
  it('pluralizes review summary', () => {
    expect(reviewSummary(1, 0)).toBe('1 Wort');
    expect(reviewSummary(0, 1)).toBe('1 Redewendung');
    expect(reviewSummary(2, 2)).toBe('2 Wörter · 2 Redewendungen');
  });

  it('uses the backend title and counts, never invented numbers', () => {
    expect(continueCopy(baseDashboard.continueLearning).title).toBe('Perfekt');
    expect(continueCopy({ ...baseDashboard.continueLearning, type: 'VOCAB_REVIEW', total: 8 }).description).toBe('8 Wörter warten auf dich.');
  });

  it('focus is encouraging, null when nothing to suggest', () => {
    expect(focusCopy({ area: 'VOCABULARY', route: null })?.area).toBe('Wortschatz');
    expect(focusCopy({ area: 'WRITING', route: null, detail: 'FORM' })?.text).toContain('Form und Anrede');
    expect(focusCopy({ area: null, route: null })).toBeNull();
    expect(JSON.stringify(focusCopy({ area: 'GRAMMAR', route: null }))).not.toMatch(/schwäch|weak/i);
  });

  it('maps the rolling 7-day window oldest → today', () => {
    const today = new Date(2026, 9, 7); // Wednesday
    const days = weekDays([true, false, false, false, false, false, true], today);
    expect(days[6]).toEqual({ label: 'Mi', learned: true, isToday: true });
    expect(days[0].label).toBe('Do');
  });
});

describe('toMobileHref', () => {
  it.each([
    ['/dashboard/daily-words', '/learn/daily-words'],
    ['/dashboard/vocabulary/practice', '/learn/vocabulary'],
    ['/dashboard/grammar/lesson?id=5', '/learn/grammar'],
    ['/dashboard/reading/article?id=9', '/learn/reading'],
    ['/dashboard/expressions', '/learn/expressions'],
    ['/dashboard/exam-prep/exercise?id=3', '/exam'],
    ['/dashboard/exam-prep/schreiben/fortschritt', '/exam'],
    ['/dashboard', '/home'],
  ])('%s → %s', (web, mobile) => expect(toMobileHref(web)).toBe(mobile));

  it('falls back safely for unknown or missing routes', () => {
    expect(toMobileHref('/something/else')).toBe('/learn');
    expect(toMobileHref(null)).toBe('/learn');
    expect(toMobileHref(undefined, '/home')).toBe('/home');
  });
});
