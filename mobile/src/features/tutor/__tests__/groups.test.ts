import { groupSessionsByDate } from '../groups';

const s = (id: string, createdAt?: string) => ({ id, userId: 'u', title: id, createdAt });

describe('groupSessionsByDate', () => {
  const now = new Date(2026, 9, 5, 15, 0); // 5 Oct 2026, local time

  it('splits into today / yesterday / earlier and keeps order inside groups', () => {
    const groups = groupSessionsByDate(
      [
        s('t1', new Date(2026, 9, 5, 9).toISOString()),
        s('y1', new Date(2026, 9, 4, 22).toISOString()),
        s('t2', new Date(2026, 9, 5, 1).toISOString()),
        s('old', new Date(2026, 8, 20).toISOString()),
        s('none'),
      ],
      now,
    );
    expect(groups.map((g) => [g.key, g.sessions.map((x) => x.id)])).toEqual([
      ['today', ['t1', 't2']],
      ['yesterday', ['y1']],
      ['earlier', ['old', 'none']],
    ]);
  });

  it('omits empty groups', () => {
    expect(groupSessionsByDate([], now)).toEqual([]);
    expect(groupSessionsByDate([s('a', new Date(2026, 9, 5).toISOString())], now).map((g) => g.key)).toEqual(['today']);
  });
});
