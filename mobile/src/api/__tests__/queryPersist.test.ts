import type { Query } from '@tanstack/react-query';
import { createQueryPersister, shouldPersistQuery } from '../queryPersist';

const query = (queryKey: unknown[], status = 'success') =>
  ({ queryKey, state: { status } }) as unknown as Query;

describe('shouldPersistQuery', () => {
  it('keeps lessons and articles', () => {
    expect(shouldPersistQuery(query(['grammar', 'lesson', 'l1']))).toBe(true);
    expect(shouldPersistQuery(query(['reading', 'article', 'r1']))).toBe(true);
    expect(shouldPersistQuery(query(['reading', 'categories']))).toBe(true);
  });

  it('skips per-user numbers, lists and unfinished queries', () => {
    expect(shouldPersistQuery(query(['dashboard']))).toBe(false);
    expect(shouldPersistQuery(query(['ai-usage']))).toBe(false);
    expect(shouldPersistQuery(query(['reading', 'list', {}]))).toBe(false);
    expect(shouldPersistQuery(query(['grammar', 'lesson', 'l1'], 'pending'))).toBe(false);
    expect(shouldPersistQuery(query(['grammar', 'lesson', 'l1'], 'error'))).toBe(false);
  });
});

describe('createQueryPersister', () => {
  it('restores what was saved and forgets it when removed', async () => {
    jest.useFakeTimers();
    const persister = createQueryPersister();
    const client = { timestamp: 1, buster: 'x', clientState: { mutations: [], queries: [] } };

    persister.persistClient(client);
    await jest.advanceTimersByTimeAsync(2500);
    expect(await persister.restoreClient()).toEqual(client);

    await persister.removeClient();
    expect(await persister.restoreClient()).toBeUndefined();
    jest.useRealTimers();
  });
});
