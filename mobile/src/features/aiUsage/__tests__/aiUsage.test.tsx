import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react-native';
import { aiUsageApi } from '@/api/aiUsageApi';
import type { AiUsage } from '@/types/aiUsage';
import { AiUsageHint, aiUsageText } from '../AiUsageHint';

jest.mock('@/api/aiUsageApi');
const api = aiUsageApi as jest.Mocked<typeof aiUsageApi>;

const wrap = (ui: React.ReactElement) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);

const settle = () => act(async () => void (await new Promise((r) => setTimeout(r, 20))));

const usage = (over: Partial<AiUsage> = {}): AiUsage => ({
  enforced: true,
  features: { AI_CHAT: { limit: 5, used: 2, remaining: 3, enabled: true } },
  ...over,
});

describe('aiUsageText', () => {
  it('words the remaining allowance, warning on the last one', () => {
    expect(aiUsageText({ limit: 5, used: 2, remaining: 3, enabled: true })).toEqual({ text: 'Noch 3 von 5 heute', warn: false });
    expect(aiUsageText({ limit: 5, used: 4, remaining: 1, enabled: true }).warn).toBe(true);
  });
  it('explains an exhausted or disabled feature', () => {
    expect(aiUsageText({ limit: 5, used: 5, remaining: 0, enabled: true }).text).toMatch(/Tageslimit erreicht/);
    expect(aiUsageText({ limit: 5, used: 0, remaining: 5, enabled: false }).text).toMatch(/nicht verfügbar/);
  });
});

describe('AiUsageHint', () => {
  beforeEach(() => api.today.mockReset());

  it('shows what is left today', async () => {
    api.today.mockResolvedValue(usage());
    await wrap(<AiUsageHint feature="AI_CHAT" />);
    expect(await screen.findByText('Noch 3 von 5 heute')).toBeTruthy();
  });

  it('shows nothing when limits are not enforced', async () => {
    api.today.mockResolvedValue(usage({ enforced: false, features: {} }));
    await wrap(<AiUsageHint feature="AI_CHAT" />);
    await settle();
    expect(screen.queryByText(/heute/)).toBeNull();
  });

  it('shows nothing for a feature without data, or when the request fails', async () => {
    api.today.mockResolvedValue(usage());
    const first = await wrap(<AiUsageHint feature="AI_WRITING_FEEDBACK" />);
    await settle();
    expect(screen.queryByText(/heute/)).toBeNull();
    await first.unmount();

    api.today.mockRejectedValue(new Error('offline'));
    await wrap(<AiUsageHint feature="AI_CHAT" />);
    await settle();
    expect(screen.queryByText(/heute/)).toBeNull();
  });
});
