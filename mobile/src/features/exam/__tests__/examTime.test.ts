import {
  elapsedSecondsAt,
  formatClock,
  formatDifference,
  getTimeStatus,
  isTimerStale,
  pausedSecondsAt,
  shortGap,
  stageToAnnounce,
  stagesUpTo,
} from '../time/examTime';
import { useExamTimerStore } from '../time/timerStore';

describe('getTimeStatus', () => {
  it('flips at the target and at 125%', () => {
    const t = 20 * 60;
    expect(getTimeStatus(t - 1, t).status).toBe('ON_TRACK');
    expect(getTimeStatus(t, t).status).toBe('TARGET_REACHED');
    expect(getTimeStatus(25 * 60, t).status).toBe('TARGET_REACHED');
    expect(getTimeStatus(25 * 60 + 1, t).status).toBe('OVER_TIME');
    expect(getTimeStatus(t + 90, t).differenceSeconds).toBe(90);
  });
});

describe('warning stages', () => {
  const t = 100;
  it('announces each stage once and treats earlier stages as seen', () => {
    expect(stageToAnnounce(79, t, [])).toBeNull();
    expect(stageToAnnounce(80, t, [])).toBe('APPROACHING');
    expect(stageToAnnounce(80, t, ['APPROACHING'])).toBeNull();
    // Asleep for a while: jumps straight to OVER_TIME.
    expect(stageToAnnounce(130, t, [])).toBe('OVER_TIME');
    expect(stagesUpTo('OVER_TIME')).toEqual(['APPROACHING', 'TARGET_REACHED', 'OVER_TIME']);
  });
});

describe('clock', () => {
  const clock = { startedAtMs: 1_000_000, pausedAtMs: null, pausedTotalMs: 0 };
  it('derives elapsed time from timestamps and freezes while paused', () => {
    expect(elapsedSecondsAt(clock, 1_000_000 + 65_000)).toBe(65);
    const paused = { ...clock, pausedAtMs: 1_000_000 + 30_000 };
    expect(elapsedSecondsAt(paused, 1_000_000 + 999_000)).toBe(30);
    expect(pausedSecondsAt(paused, 1_000_000 + 40_000)).toBe(10);
    const resumed = { ...clock, pausedTotalMs: 20_000 };
    expect(elapsedSecondsAt(resumed, 1_000_000 + 65_000)).toBe(45);
    expect(pausedSecondsAt(resumed, 1_000_000 + 65_000)).toBe(20);
  });
  it('treats very old timers as abandoned', () => {
    expect(isTimerStale(clock, clock.startedAtMs + 7 * 3600_000)).toBe(true);
    expect(isTimerStale(clock, clock.startedAtMs + 3600_000)).toBe(false);
  });
});

describe('formatting', () => {
  it('formats clocks and differences', () => {
    expect(formatClock(5400)).toBe('90:00');
    expect(formatClock(-3)).toBe('00:00');
    expect(formatDifference(198)).toBe('+03:18');
    expect(formatDifference(-78)).toBe('-01:18');
    expect(formatDifference(0)).toBe('00:00');
    expect(shortGap(-198)).toBe('3:18');
  });
});

describe('timer store', () => {
  const session = {
    id: 's1',
    scope: 'EXERCISE' as const,
    mode: 'TIME_TRAINING' as const,
    section: 'LESEVERSTEHEN' as const,
    level: 'B1',
    teil: 1,
    exerciseId: 'e1',
    startedAt: '2026-01-01T00:00:00Z',
    targetSeconds: 600,
  };
  beforeEach(() => useExamTimerStore.setState({ active: null, lastResult: null }));

  it('pauses and resumes, accumulating the pause', () => {
    const s = useExamTimerStore.getState();
    s.start(session, 1000);
    s.pause(11_000);
    s.pause(12_000); // already paused: ignored
    expect(useExamTimerStore.getState().active?.pausedAtMs).toBe(11_000);
    s.resume(16_000);
    const a = useExamTimerStore.getState().active!;
    expect([a.pausedAtMs, a.pausedTotalMs]).toEqual([null, 5000]);
    s.resume(20_000); // not paused: ignored
    expect(useExamTimerStore.getState().active?.pausedTotalMs).toBe(5000);
  });

  it('remembers announced and dismissed stages without duplicates', () => {
    const s = useExamTimerStore.getState();
    s.start(session);
    s.markAnnounced(['APPROACHING']);
    s.markAnnounced(['APPROACHING', 'TARGET_REACHED']);
    s.dismissWarning('TARGET_REACHED');
    const a = useExamTimerStore.getState().active!;
    expect(a.announced).toEqual(['APPROACHING', 'TARGET_REACHED']);
    expect(a.dismissed).toEqual(['TARGET_REACHED']);
    s.clear();
    expect(useExamTimerStore.getState().active).toBeNull();
  });
});
