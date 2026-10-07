import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import { notificationApi } from '@/api/notificationApi';
import { useAuthStore } from '@/stores/authStore';
import type { NotificationItem, NotificationPreferences } from '@/types/notification';
import type { UserProfile } from '@/types/user';
import { buildRows, NotificationsScreen } from '../NotificationsScreen';
import { PreferencesScreen } from '../PreferencesScreen';
import { dictionaries } from '@/i18n';
import { dayBucket, isValidTime, relativeTime } from '../time';

const relativeTimeDe = (iso: string, now: Date) => relativeTime(iso, dictionaries.en.notifications.time, now);

jest.mock('@/api/notificationApi');
jest.mock('../push', () => ({ getPushState: async () => 'unsupported', enablePush: jest.fn() }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const api = notificationApi as jest.Mocked<typeof notificationApi>;

const wrap = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } })}>
      {ui}
    </QueryClientProvider>,
  );

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
const item = (id: string, over: Partial<NotificationItem> = {}): NotificationItem => ({
  id,
  type: 'DAILY_REMINDER',
  category: 'REMINDER',
  title: `Titel ${id}`,
  body: `Text ${id}`,
  entityType: null,
  entityId: null,
  actionUrl: '/dashboard/grammar',
  read: false,
  status: 'SENT',
  createdAt: ago(5),
  ...over,
});
const page = (items: NotificationItem[], hasNext = false, p = 0) => ({ items, page: p, size: 20, totalElements: items.length, hasNext });

beforeEach(() => {
  // Not jest.resetAllMocks(): that also wipes React Native's own native-component mocks (e.g. Switch).
  jest.clearAllMocks();
  Object.values(api).forEach((fn) => (fn as jest.Mock).mockReset());
  api.unreadCount.mockResolvedValue({ count: 2 });
});

describe('time helpers', () => {
  it('groups by local day', () => {
    const noon = new Date(2026, 9, 5, 12);
    expect(dayBucket(new Date(2026, 9, 5, 1).toISOString(), noon)).toBe('today');
    expect(dayBucket(new Date(2026, 9, 4, 23).toISOString(), noon)).toBe('yesterday');
    expect(dayBucket(new Date(2026, 9, 1).toISOString(), noon)).toBe('earlier');
  });
  it('words relative times in German', () => {
    const base = new Date(2026, 9, 5, 12);
    const at = (min: number) => new Date(base.getTime() - min * 60_000).toISOString();
    expect(relativeTimeDe(at(0), base)).toBe('just now');
    expect(relativeTimeDe(at(1), base)).toBe('1 minute ago');
    expect(relativeTimeDe(at(5), base)).toBe('5 minutes ago');
    expect(relativeTimeDe(at(60), base)).toBe('1 hour ago');
    expect(relativeTimeDe(at(3 * 60), base)).toBe('3 hours ago');
    expect(relativeTimeDe(at(24 * 60), base)).toBe('1 day ago');
    expect(relativeTimeDe(at(14 * 24 * 60), base)).toBe('2 weeks ago');
  });
  it('validates HH:mm', () => {
    expect(['00:00', '18:30', '23:59'].every(isValidTime)).toBe(true);
    expect(['24:00', '7:30', '18:60', 'abc', ''].some(isValidTime)).toBe(false);
  });
  it('builds rows with day headers', () => {
    const rows = buildRows([item('a'), item('b', { createdAt: new Date(2020, 0, 1).toISOString() })], now);
    expect(rows.map((r) => (r.kind === 'header' ? r.bucket : r.item.id))).toEqual(['today', 'a', 'earlier', 'b']);
  });
});

describe('NotificationsScreen', () => {
  it('lists notifications by day and opens one: click is tracked and its destination followed', async () => {
    api.page.mockResolvedValue(page([item('n1'), item('n2', { read: true, actionUrl: '/dashboard/exam-prep/exercise?id=e7' })]));
    api.click.mockImplementation(async (id) => item(id, { read: true, actionUrl: id === 'n1' ? '/dashboard/grammar' : '/dashboard/exam-prep/exercise?id=e7' }));
    await wrap(<NotificationsScreen />);
    expect(await screen.findByText('Titel n1')).toBeTruthy();
    expect(screen.getByText('TODAY')).toBeTruthy();
    expect(screen.getByText('2 unread')).toBeTruthy();
    expect(api.page).toHaveBeenCalledWith(0, 20, []);

    await fireEvent.press(screen.getByRole('button', { name: /Unread: Titel n1/ }));
    await waitFor(() => expect(api.click).toHaveBeenCalledWith('n1'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/learn/grammar'));
    expect(await screen.findByText('1 unread')).toBeTruthy(); // optimistic

    await fireEvent.press(screen.getByRole('button', { name: /Titel n2/ }));
    await waitFor(() => expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/exam-prep/exercise/[exerciseId]', params: { exerciseId: 'e7' } }));
  });

  it('does not navigate for unknown or unsafe destinations', async () => {
    api.page.mockResolvedValue(page([item('n1', { actionUrl: null }), item('n2', { actionUrl: '//evil.example' }), item('n3', { actionUrl: '/somewhere/else' })]));
    api.click.mockImplementation(async (id) => item(id, { actionUrl: id === 'n1' ? null : id === 'n2' ? '//evil.example' : '/somewhere/else' }));
    await wrap(<NotificationsScreen />);
    for (const id of ['n1', 'n2', 'n3']) {
      await fireEvent.press(await screen.findByRole('button', { name: new RegExp(`Titel ${id}`) }));
      await waitFor(() => expect(api.click).toHaveBeenCalledWith(id));
    }
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('still navigates when click tracking fails', async () => {
    api.page.mockResolvedValue(page([item('n1')]));
    api.click.mockRejectedValue(new ApiError('network', 'x'));
    await wrap(<NotificationsScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: /Titel n1/ }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/learn/grammar'));
  });

  it('filters by tab and marks everything read', async () => {
    api.page.mockResolvedValue(page([item('n1')]));
    api.markAllRead.mockResolvedValue(undefined);
    await wrap(<NotificationsScreen />);
    await screen.findByText('Titel n1');
    await fireEvent.press(screen.getByRole('button', { name: 'Learning' }));
    await waitFor(() => expect(api.page).toHaveBeenCalledWith(0, 20, ['LEARNING', 'REMINDER']));

    await fireEvent.press(await screen.findByRole('button', { name: 'Mark all as read' }));
    await waitFor(() => expect(api.markAllRead).toHaveBeenCalled());
    expect(await screen.findByText('All caught up')).toBeTruthy();
  });

  it('loads the next page when scrolled to the end', async () => {
    api.page.mockResolvedValueOnce(page([item('n1')], true, 0)).mockResolvedValueOnce(page([item('n2')], false, 1));
    await wrap(<NotificationsScreen />);
    await screen.findByText('Titel n1');
    await fireEvent(screen.getByTestId('notification-list'), 'endReached');
    expect(await screen.findByText('Titel n2')).toBeTruthy();
    expect(api.page).toHaveBeenLastCalledWith(1, 20, []);
  });

  it('shows an empty state', async () => {
    api.page.mockResolvedValue(page([]));
    await wrap(<NotificationsScreen />);
    expect(await screen.findByText('No notifications')).toBeTruthy();
  });

  it('shows an error state', async () => {
    api.page.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<NotificationsScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
  });
});

describe('PreferencesScreen', () => {
  const prefs: NotificationPreferences = {
    learningRemindersEnabled: true,
    reviewRemindersEnabled: true,
    dailyPlanRemindersEnabled: false,
    examRemindersEnabled: true,
    progressNotificationsEnabled: true,
    milestoneNotificationsEnabled: true,
    weeklyProgressEnabled: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    preferredReminderTime: '18:00',
    timezone: 'Europe/Berlin',
  };

  beforeEach(() => {
    useAuthStore.setState({ profile: { notificationsEnabled: true } as UserProfile });
    api.preferences.mockResolvedValue(prefs);
    api.updatePreferences.mockImplementation(async (patch) => ({ message: 'ok', data: { ...prefs, ...patch } }));
  });

  it('toggles are saved immediately; the master switch also disables its children and mirrors into the profile', async () => {
    await wrap(<PreferencesScreen />);
    const master = await screen.findByLabelText('Daily reminders');
    await fireEvent(master, 'valueChange', false);
    await waitFor(() => expect(api.updatePreferences).toHaveBeenCalledWith({ learningRemindersEnabled: false }));
    await waitFor(() => expect(screen.getByLabelText('Review reminders').props.disabled).toBe(true));
    expect(useAuthStore.getState().profile?.notificationsEnabled).toBe(false);
  });

  it('rolls a toggle back when saving fails', async () => {
    api.updatePreferences.mockRejectedValue(new ApiError('server', 'x'));
    await wrap(<PreferencesScreen />);
    await fireEvent(await screen.findByLabelText('Exam reminders'), 'valueChange', false);
    expect(await screen.findByText(/could not be saved/)).toBeTruthy();
    expect(screen.getByLabelText('Exam reminders').props.value).toBe(true);
  });

  it('saves a valid time only, and shows quiet hours fields when enabled', async () => {
    await wrap(<PreferencesScreen />);
    const time = await screen.findByLabelText('Preferred reminder time');
    await fireEvent.changeText(time, '25:00');
    expect(await screen.findByText(/format HH:mm/)).toBeTruthy();
    expect(api.updatePreferences).not.toHaveBeenCalled();
    await fireEvent.changeText(time, '19:30');
    await waitFor(() => expect(api.updatePreferences).toHaveBeenCalledWith({ preferredReminderTime: '19:30' }));

    expect(screen.queryByLabelText('Quiet hours from')).toBeNull();
    await fireEvent(screen.getByLabelText('Quiet hours'), 'valueChange', true);
    expect(await screen.findByLabelText('Quiet hours from')).toBeTruthy();
  });

  it('reports the device timezone once when the backend has none', async () => {
    api.preferences.mockResolvedValue({ ...prefs, timezone: null });
    await wrap(<PreferencesScreen />);
    await waitFor(() => expect(api.updatePreferences).toHaveBeenCalledWith({ timezone: expect.any(String) }));
    expect(api.updatePreferences).toHaveBeenCalledTimes(1);
  });

  it('shows an error state', async () => {
    api.preferences.mockRejectedValue(new ApiError('network', 'Keine Verbindung.'));
    await wrap(<PreferencesScreen />);
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();
  });
});

describe('Persian interface', () => {
  it('words relative times in Persian', () => {
    const now = new Date('2026-10-07T12:00:00Z');
    const at = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
    const time = dictionaries.fa.notifications.time;
    expect(relativeTime(at(0), time, now)).toBe('همین الان');
    expect(relativeTime(at(5), time, now)).toBe('5 دقیقه پیش');
    expect(relativeTime(at(3 * 60), time, now)).toBe('3 ساعت پیش');
  });
});
