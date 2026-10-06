import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { ApiError } from '@/api/errors';
import { grammarApi } from '@/api/grammarApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { LessonScreen } from '../LessonScreen';
import { makeLesson } from '../testing/fixtures';

jest.mock('@/api/grammarApi');
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => ({ lessonId: 'l1' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-image', () => ({ Image: () => null }));

const lessonApi = grammarApi.lesson as jest.MockedFunction<typeof grammarApi.lesson>;
const navApi = grammarApi.navigation as jest.MockedFunction<typeof grammarApi.navigation>;
const setLearned = grammarApi.setLearned as jest.MockedFunction<typeof grammarApi.setLearned>;
const addBookmark = grammarApi.addBookmark as jest.MockedFunction<typeof grammarApi.addBookmark>;

const renderScreen = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false, gcTime: Infinity },
            mutations: { gcTime: Infinity },
          },
        })
      }
    >
      <LessonScreen />
    </QueryClientProvider>,
  );

describe('LessonScreen', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    useAuthStore.setState({ profile: { preferredLanguage: 'EN' } as UserProfile });
    lessonApi.mockResolvedValue(makeLesson());
    navApi.mockResolvedValue({
      previous: null,
      next: { id: 'l2', title: 'Das Präteritum', titleFa: null, level: 'A2' },
    });
    setLearned.mockResolvedValue({});
  });

  it('renders markdown content, example and tips', async () => {
    await renderScreen();
    expect(await screen.findByText('Das Perfekt')).toBeTruthy();
    expect(screen.getByText('Regel')).toBeTruthy(); // ## heading from markdown
    expect(screen.getByText('Person')).toBeTruthy(); // table header
    expect(screen.getAllByText('habe').length).toBeGreaterThan(0); // table cell + example
    expect(screen.getByText('💬 Beispiel')).toBeTruthy();
    expect(screen.getByText('Im Alltag benutzt man das Perfekt.')).toBeTruthy();
  });

  it('lets you answer the quick check and try again', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Antwort: bin' }));
    expect(await screen.findByText('🎉 Richtig!')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Nochmal versuchen' }));
    expect(screen.queryByText('🎉 Richtig!')).toBeNull();
  });

  it('marks the lesson learned and can undo it', async () => {
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Als gelernt markieren' }));
    expect(setLearned).toHaveBeenCalledWith('l1', true);
    expect(await screen.findByRole('button', { name: '✓ Gelernt – zurücksetzen' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: '✓ Gelernt – zurücksetzen' }));
    expect(setLearned).toHaveBeenLastCalledWith('l1', false);
  });

  it('shows the error and keeps the state when marking fails', async () => {
    setLearned.mockRejectedValueOnce(
      new ApiError('server', 'Der Server ist gerade nicht erreichbar.'),
    );
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: 'Als gelernt markieren' }));
    expect(await screen.findByText('Der Server ist gerade nicht erreichbar.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Als gelernt markieren' })).toBeTruthy();
  });

  it('bookmarks the lesson', async () => {
    addBookmark.mockResolvedValue(makeLesson({ bookmarked: true }));
    await renderScreen();
    await fireEvent.press(await screen.findByRole('button', { name: '☆ Für später merken' }));
    expect(await screen.findByRole('button', { name: '★ Gemerkt – entfernen' })).toBeTruthy();
  });

  it('navigates to the next lesson and to the exercises', async () => {
    await renderScreen();
    await fireEvent.press((await screen.findAllByRole('button', { name: 'Nächste ›' }))[0]);
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/grammar/[lessonId]',
      params: { lessonId: 'l2' },
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Übungen starten' }));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/grammar/practice/[lessonId]',
      params: { lessonId: 'l1' },
    });
  });

  it('hides the exercises card for lessons without playable questions and opens the video', async () => {
    lessonApi.mockResolvedValue(makeLesson({ quiz: [], videoLink: 'https://example.com/v' }));
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderScreen();
    expect(await screen.findByText('Das Perfekt')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Übungen starten' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: '▶ Video ansehen' }));
    expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/v');
  });

  it('uses Persian text for translatable levels and shows an error state with retry', async () => {
    useAuthStore.setState({ profile: { preferredLanguage: 'PR' } as UserProfile });
    lessonApi.mockResolvedValue(
      makeLesson({ titleFa: 'ماضی', summaryFa: 'خلاصه', contentFa: 'متن فارسی' }),
    );
    await renderScreen();
    expect(await screen.findByText('ماضی')).toBeTruthy();
    expect(screen.getByText('متن فارسی')).toBeTruthy();
  });

  it('shows an error state with retry when the lesson cannot be loaded', async () => {
    lessonApi.mockRejectedValueOnce(
      new ApiError('notFound', 'Dieser Inhalt wurde nicht gefunden.', 404),
    );
    await renderScreen();
    expect(await screen.findByText('Dieser Inhalt wurde nicht gefunden.')).toBeTruthy();
  });
});
