import { configureApiClient, request } from '../client';
import { ApiError } from '../errors';
import { tokenStorage } from '../tokenStorage';

const json = (status: number, body?: unknown) =>
  Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('api client', () => {
  const fetchMock = jest.fn();
  const onSessionExpired = jest.fn();

  beforeEach(async () => {
    fetchMock.mockReset();
    onSessionExpired.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    configureApiClient({ getLanguage: () => 'fa', onSessionExpired, onLimitReached: undefined });
    await tokenStorage.setTokens('old-access', 'refresh-1');
  });

  it('sends bearer token and upper-cased Accept-Language', async () => {
    fetchMock.mockReturnValueOnce(json(200, { ok: true }));
    await request('/dashboard');
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers.Authorization).toBe('Bearer old-access');
    expect(init.headers['Accept-Language']).toBe('FA');
  });

  it('refreshes once for concurrent 401s and retries both requests', async () => {
    fetchMock.mockImplementation((url: string, init: { headers: Record<string, string> }) => {
      if (url.endsWith('/auth/mobile/refresh')) return json(200, { data: { accessToken: 'new-access' } });
      return init.headers.Authorization === 'Bearer new-access' ? json(200, { ok: 1 }) : json(401);
    });

    const [a, b] = await Promise.all([request('/a'), request('/b')]);

    expect(a).toEqual({ ok: 1 });
    expect(b).toEqual({ ok: 1 });
    const refreshCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/mobile/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(await tokenStorage.getAccess()).toBe('new-access');
  });

  it('clears the session when the refresh token is rejected', async () => {
    fetchMock.mockImplementation((url: string) => json(String(url).endsWith('/refresh') ? 403 : 401));
    await expect(request('/a')).rejects.toMatchObject({ kind: 'unauthorized' });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(await tokenStorage.getAccess()).toBeNull();
  });

  it('keeps the session on network failure during refresh', async () => {
    fetchMock.mockImplementation((url: string) =>
      String(url).endsWith('/refresh') ? Promise.reject(new TypeError('offline')) : json(401),
    );
    await expect(request('/a')).rejects.toMatchObject({ kind: 'network' });
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(await tokenStorage.getRefresh()).toBe('refresh-1');
  });

  it('normalizes errors and reports daily limits', async () => {
    const onLimitReached = jest.fn();
    configureApiClient({ onLimitReached });
    fetchMock.mockReturnValueOnce(json(429, { message: 'Daily limit reached (5/day).' }));
    const error = (await request('/ollama/chat', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('limit');
    expect(onLimitReached).toHaveBeenCalledWith('Daily limit reached (5/day).');
  });

  it('hides raw 5xx messages', async () => {
    fetchMock.mockReturnValueOnce(json(500, { message: 'NullPointerException at ...' }));
    const error = (await request('/x').catch((e: unknown) => e)) as ApiError;
    expect(error.kind).toBe('server');
    expect(error.message).not.toContain('NullPointer');
  });

  it('maps fetch failures to network errors', async () => {
    fetchMock.mockReturnValueOnce(Promise.reject(new TypeError('Network request failed')));
    await expect(request('/x')).rejects.toMatchObject({ kind: 'network' });
  });
});
