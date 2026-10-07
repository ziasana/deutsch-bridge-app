import NetInfo from '@react-native-community/netinfo';
import { ApiError } from '@/api/errors';
import { grammarApi } from '@/api/grammarApi';
import { readingApi } from '@/api/readingApi';
import { collectArticleIds } from '@/features/reading/ReadingDownloadBar';
import { downloadItem, downloadMany, removeDownload } from '../actions';
import { deliverOrQueue, loadItem } from '../offline';
import { outbox } from '../outbox';
import { downloadsStorage } from '../storage';
import { useDownloadsStore } from '../store';

jest.mock('@/api/grammarApi', () => ({
  grammarApi: {
    lesson: jest.fn(),
    setLearned: jest.fn(),
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
  },
}));
jest.mock('@/api/readingApi', () => ({
  readingApi: {
    page: jest.fn(),
    article: jest.fn(),
    setLearned: jest.fn(),
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
  },
}));

const lesson = (overrides = {}) => ({
  id: 'l1',
  title: 'Perfekt',
  level: 'A2',
  bookmarked: false,
  learningProgresses: [],
  ...overrides,
});

const networkError = () => new ApiError('network', 'offline');
const setOffline = (offline: boolean) =>
  (NetInfo.fetch as jest.Mock).mockResolvedValue({
    isConnected: !offline,
    isInternetReachable: !offline,
  });

beforeEach(async () => {
  await downloadsStorage.clear();
  await outbox.clear();
  useDownloadsStore.setState({ items: {}, busy: new Set(), hydrated: true });
  setOffline(false);
  jest.clearAllMocks();
});

describe('downloadsStorage', () => {
  it('stores content and lists it in the index', async () => {
    const index = await downloadsStorage.write('grammar', 'l1', lesson(), {
      title: 'Perfekt',
      level: 'A2',
    });
    expect(index['grammar:l1']).toMatchObject({ title: 'Perfekt', level: 'A2' });
    expect(await downloadsStorage.read('grammar', 'l1')).toMatchObject({ id: 'l1' });
  });

  it('keeps every entry when downloads finish at the same time', async () => {
    await Promise.all(
      ['a', 'b', 'c'].map((id) =>
        downloadsStorage.write('grammar', id, lesson({ id }), { title: id, level: 'A1' }),
      ),
    );
    expect(Object.keys(await downloadsStorage.listIndex())).toHaveLength(3);
  });

  it('removes content and its index entry', async () => {
    await downloadsStorage.write('reading', 'r1', lesson({ id: 'r1' }), {
      title: 'x',
      level: 'A1',
    });
    const index = await downloadsStorage.remove('reading', 'r1');
    expect(index).toEqual({});
    expect(await downloadsStorage.read('reading', 'r1')).toBeNull();
  });
});

describe('loadItem', () => {
  const save = () =>
    downloadsStorage.write('grammar', 'l1', lesson({ title: 'Old' }), {
      title: 'Old',
      level: 'A2',
    });

  it('uses the network when nothing is downloaded', async () => {
    const fetcher = jest.fn(async () => lesson());
    await expect(loadItem('grammar', 'l1', fetcher)).resolves.toMatchObject({ title: 'Perfekt' });
    expect(fetcher).toHaveBeenCalled();
  });

  it('serves the downloaded copy without a request while offline', async () => {
    await save();
    setOffline(true);
    const fetcher = jest.fn();
    await expect(loadItem('grammar', 'l1', fetcher)).resolves.toMatchObject({ title: 'Old' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('falls back to the downloaded copy when the request fails for lack of connection', async () => {
    await save();
    const fetcher = jest.fn().mockRejectedValue(networkError());
    await expect(loadItem('grammar', 'l1', fetcher)).resolves.toMatchObject({ title: 'Old' });
  });

  it('still reports other failures', async () => {
    await save();
    const fetcher = jest.fn().mockRejectedValue(new ApiError('notFound', 'gone', 404));
    await expect(loadItem('grammar', 'l1', fetcher)).rejects.toMatchObject({ kind: 'notFound' });
  });

  it('refreshes the downloaded copy when online', async () => {
    await save();
    await loadItem('grammar', 'l1', async () => lesson({ title: 'New' }));
    await new Promise((r) => setTimeout(r, 0));
    expect(await downloadsStorage.read('grammar', 'l1')).toMatchObject({ title: 'New' });
  });

  it('keeps images already saved on the device when refreshing', async () => {
    await downloadsStorage.write(
      'reading',
      'r1',
      lesson({ id: 'r1', imageUrl: 'file:///downloads/reading/r1-cover' }),
      { title: 'x', level: 'A1' },
    );
    const merged = await loadItem('reading', 'r1', async () =>
      lesson({ id: 'r1', imageUrl: 'https://cdn/x.png' }),
    );
    expect(merged).toMatchObject({ imageUrl: 'file:///downloads/reading/r1-cover' });
  });
});

describe('offline progress', () => {
  it('queues a change made without a connection and shows it on the downloaded copy', async () => {
    await downloadsStorage.write('grammar', 'l1', lesson(), { title: 'Perfekt', level: 'A2' });
    setOffline(true);
    const send = jest.fn().mockRejectedValue(networkError());

    await expect(
      deliverOrQueue({ field: 'learned', kind: 'grammar', id: 'l1', value: true }, send),
    ).resolves.toBeUndefined();

    expect(await outbox.list()).toHaveLength(1);
    const opened = await loadItem('grammar', 'l1', jest.fn());
    expect(opened.learningProgresses[0]).toMatchObject({ learned: true });
  });

  it('does not swallow errors that are not connection problems', async () => {
    const send = jest.fn().mockRejectedValue(new ApiError('validation', 'bad', 400));
    await expect(
      deliverOrQueue({ field: 'learned', kind: 'grammar', id: 'l1', value: true }, send),
    ).rejects.toMatchObject({ kind: 'validation' });
    expect(await outbox.list()).toHaveLength(0);
  });

  it('keeps only the latest value per flag', async () => {
    await outbox.enqueue({ field: 'bookmarked', kind: 'grammar', id: 'l1', value: true });
    await outbox.enqueue({ field: 'bookmarked', kind: 'grammar', id: 'l1', value: false });
    expect(await outbox.list()).toEqual([
      { field: 'bookmarked', kind: 'grammar', id: 'l1', value: false },
    ]);
  });

  it('delivers queued changes when back online', async () => {
    await outbox.enqueue({ field: 'learned', kind: 'grammar', id: 'l1', value: true });
    await outbox.enqueue({ field: 'bookmarked', kind: 'grammar', id: 'l2', value: true });
    (grammarApi.setLearned as jest.Mock).mockResolvedValue(undefined);
    (grammarApi.addBookmark as jest.Mock).mockResolvedValue({});

    await expect(outbox.flush()).resolves.toBe(2);

    expect(grammarApi.setLearned).toHaveBeenCalledWith('l1', true);
    expect(grammarApi.addBookmark).toHaveBeenCalledWith('l2');
    expect(await outbox.list()).toHaveLength(0);
  });

  it('keeps the queue while still offline', async () => {
    await outbox.enqueue({ field: 'learned', kind: 'grammar', id: 'l1', value: true });
    (grammarApi.setLearned as jest.Mock).mockRejectedValue(networkError());
    await expect(outbox.flush()).resolves.toBe(0);
    expect(await outbox.list()).toHaveLength(1);
  });

  it('drops an entry the server rejects so it cannot block the rest', async () => {
    await outbox.enqueue({ field: 'learned', kind: 'grammar', id: 'gone', value: true });
    await outbox.enqueue({ field: 'learned', kind: 'grammar', id: 'l2', value: true });
    (grammarApi.setLearned as jest.Mock)
      .mockRejectedValueOnce(new ApiError('notFound', 'x', 404))
      .mockResolvedValueOnce(undefined);
    await expect(outbox.flush()).resolves.toBe(1);
    expect(await outbox.list()).toHaveLength(0);
  });
});

describe('downloadMany', () => {
  it('saves every item and reports progress', async () => {
    (grammarApi.lesson as jest.Mock).mockImplementation(async (id: string) =>
      lesson({ id, title: id }),
    );
    const progress: number[] = [];

    const failed = await downloadMany('grammar', ['a', 'b', 'c', 'd'], (done) =>
      progress.push(done),
    );

    expect(failed).toBe(0);
    expect(progress).toEqual([1, 2, 3, 4]);
    expect(Object.keys(useDownloadsStore.getState().items).sort()).toEqual([
      'grammar:a',
      'grammar:b',
      'grammar:c',
      'grammar:d',
    ]);
  });

  it('keeps going when one item fails and counts it', async () => {
    (grammarApi.lesson as jest.Mock).mockImplementation(async (id: string) => {
      if (id === 'b') throw networkError();
      return lesson({ id, title: id });
    });

    const failed = await downloadMany('grammar', ['a', 'b', 'c']);

    expect(failed).toBe(1);
    expect(Object.keys(useDownloadsStore.getState().items).sort()).toEqual([
      'grammar:a',
      'grammar:c',
    ]);
  });
});

describe('reading downloads', () => {
  const article = {
    ...lesson({ id: 'r1', title: 'Der Zug' }),
    imageUrl: '/uploads/cover.png',
    thumbnailUrl: null,
  };

  it('saves the cover image locally, counts its size and removes it with the article', async () => {
    (readingApi.article as jest.Mock).mockResolvedValue(article);

    await downloadItem('reading', 'r1');

    const saved = await downloadsStorage.read<typeof article>('reading', 'r1');
    expect(saved?.imageUrl).toBe('file:///downloads/reading/r1/cover');
    expect(useDownloadsStore.getState().items['reading:r1'].imageBytes).toBe(6);

    await removeDownload('reading', 'r1');
    expect(useDownloadsStore.getState().items).toEqual({});
  });

  it('collects the ids of every page of a filtered list', async () => {
    (readingApi.page as jest.Mock)
      .mockResolvedValueOnce({ items: [{ id: 'a' }, { id: 'b' }], totalPages: 2 })
      .mockResolvedValueOnce({ items: [{ id: 'c' }], totalPages: 2 });

    const ids = await collectArticleIds({
      level: 'A2',
      search: '',
      bookmarked: true,
      categoryId: '',
    });

    expect(ids).toEqual(['a', 'b', 'c']);
    expect(readingApi.page).toHaveBeenCalledTimes(2);
  });
});
