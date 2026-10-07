import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { chatApi, chatVocabularyApi } from '@/api/chatApi';
import { ApiError } from '@/api/errors';
import { I18nProvider } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { TutorScreen } from '../TutorScreen';

jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@/api/chatApi');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-image', () => ({ Image: () => null }));

const chat = chatApi as jest.Mocked<typeof chatApi>;
const vocab = chatVocabularyApi as jest.Mocked<typeof chatVocabularyApi>;

const wrap = () =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } })}
    >
      <TutorScreen />
    </QueryClientProvider>,
  );

const today = new Date().toISOString();
const session = (id: string, title: string) => ({ id, userId: 'u', title, createdAt: today });

beforeEach(() => {
  jest.resetAllMocks();
  chat.sessions.mockResolvedValue([]);
});

describe('TutorScreen', () => {
  it('shows starters; a starter prefills the composer', async () => {
    await wrap();
    expect(await screen.findByText('Guten Tag! 👋')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: /Grammar/ }));
    expect(screen.getByLabelText('Message').props.value).toMatch(/Grammatik/);
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('sends a message, shows the reply, and the new session appears with its AI title', async () => {
    chat.send.mockResolvedValue({ sessionId: 's1', userId: 'u', role: '', content: 'Hallo! **Wie geht’s?**', sessionTitle: 'Begrüßung' });
    await wrap();
    await screen.findByText('Guten Tag! 👋');
    await fireEvent.changeText(screen.getByLabelText('Message'), 'Hallo');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Hallo')).toBeTruthy(); // the user's bubble
    expect(await screen.findByText('Wie geht’s?', { exact: false })).toBeTruthy();
    expect(chat.send).toHaveBeenCalledWith('Hallo', '');
    expect(screen.getByLabelText('Message').props.value).toBe('');
    expect(await screen.findByText('Begrüßung')).toBeTruthy(); // header title

    // The follow-up continues the same session.
    chat.send.mockResolvedValue({ sessionId: 's1', userId: 'u', role: '', content: 'Gut!' });
    await fireEvent.changeText(screen.getByLabelText('Message'), 'Gut, danke');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(chat.send).toHaveBeenLastCalledWith('Gut, danke', 's1'));
  });

  it('shows the limit message and lets you resend without duplicating the question', async () => {
    chat.send
      .mockRejectedValueOnce(new ApiError('network', 'Keine Verbindung.'))
      .mockResolvedValueOnce({ sessionId: 's2', userId: 'u', role: '', content: 'Jetzt klappt es.' });
    await wrap();
    await fireEvent.changeText(await screen.findByLabelText('Message'), 'Hilfe');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Keine Verbindung.')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Jetzt klappt es.')).toBeTruthy();
    expect(screen.getAllByText('Hilfe')).toHaveLength(1);
    expect(chat.send).toHaveBeenCalledTimes(2);
  });

  it('shows the daily AI limit message', async () => {
    chat.send.mockRejectedValue(new ApiError('limit', 'Dein Tageslimit für den AI Tutor ist erreicht.', 429));
    await wrap();
    await fireEvent.changeText(await screen.findByLabelText('Message'), 'Noch eine Frage');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Daily limit reached')).toBeTruthy();
  });

  it('opens a past conversation from the history and loads its messages', async () => {
    chat.sessions.mockResolvedValue([session('s1', 'Dativ üben'), session('s2', 'Reisen')]);
    chat.messages.mockResolvedValue([
      { id: 'm1', role: 'user', content: 'Erkläre Dativ' },
      { id: 'm2', role: 'assistant', content: 'Der Dativ antwortet auf „wem?“' },
      { id: 'm3', role: 'system', content: 'versteckt' },
    ]);
    await wrap();
    await fireEvent.press(await screen.findByRole('button', { name: 'Show conversations' }));
    expect(await screen.findByText('TODAY')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Dativ üben' }));

    expect(await screen.findByText('Erkläre Dativ')).toBeTruthy();
    expect(screen.getByText('Der Dativ antwortet auf „wem?“', { exact: false })).toBeTruthy();
    expect(screen.queryByText('versteckt')).toBeNull();
    expect(chat.messages).toHaveBeenCalledWith('s1');
    expect(screen.getAllByText('Dativ üben').length).toBeGreaterThan(0);
  });

  it('renames the open conversation', async () => {
    chat.sessions.mockResolvedValue([session('s1', 'Alt')]);
    chat.messages.mockResolvedValue([{ id: 'm1', role: 'user', content: 'Hi' }]);
    chat.rename.mockResolvedValue(session('s1', 'Neu'));
    await wrap();
    await fireEvent.press(await screen.findByRole('button', { name: 'Show conversations' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Alt' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Rename chat' }));
    await fireEvent.changeText(screen.getByLabelText('Title'), 'Neu');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(chat.rename).toHaveBeenCalledWith('s1', 'Neu'));
    expect((await screen.findAllByText('Neu')).length).toBeGreaterThan(0);
  });

  it('deletes the open conversation after confirming and returns to a new chat', async () => {
    chat.sessions.mockResolvedValue([session('s1', 'Weg damit')]);
    chat.messages.mockResolvedValue([{ id: 'm1', role: 'user', content: 'Hi' }]);
    chat.remove.mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    await wrap();
    await fireEvent.press(await screen.findByRole('button', { name: 'Show conversations' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Weg damit' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete chat' }));
    expect(alert).toHaveBeenCalled();
    await waitFor(() => expect(chat.remove).toHaveBeenCalledWith('s1'));
    expect(await screen.findByText('Guten Tag! 👋')).toBeTruthy();
  });

  it('saves a word from a tutor answer to vocabulary, and says when it already exists', async () => {
    chat.send.mockResolvedValue({ sessionId: 's1', userId: 'u', role: '', content: 'Das **Fernweh** ist ein schönes Wort.', sessionTitle: 'Wörter' });
    vocab.classify.mockResolvedValue({ type: 'WORD', normalizedText: 'das Fernweh', meaning: 'wanderlust', example: 'Ich habe Fernweh.' });
    vocab.exists.mockResolvedValueOnce({ exists: false, vocabularyItemId: null }).mockResolvedValueOnce({ exists: true, vocabularyItemId: 'v1' });
    vocab.create.mockResolvedValue({});
    await wrap();
    await fireEvent.changeText(await screen.findByLabelText('Message'), 'Ein Wort bitte');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Save a word from this answer' }));

    await fireEvent.changeText(await screen.findByLabelText('Word or phrase'), 'Fernweh');
    await fireEvent.press(screen.getByRole('button', { name: 'Add to vocabulary' }));
    expect(await screen.findByText(/Added to vocabulary: das Fernweh – wanderlust/)).toBeTruthy();
    expect(vocab.classify).toHaveBeenCalledWith('Fernweh', 'Das **Fernweh** ist ein schönes Wort.');
    expect(vocab.create).toHaveBeenCalledWith(
      expect.objectContaining({ word: 'das Fernweh', meaning: 'wanderlust', example: 'Ich habe Fernweh.', sourceChatId: 's1' }),
    );

    // Saving it again reports the duplicate instead of creating another entry.
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Save a word from this answer' }));
    await fireEvent.changeText(await screen.findByLabelText('Word or phrase'), 'Fernweh');
    await fireEvent.press(screen.getByRole('button', { name: 'Add to vocabulary' }));
    expect(await screen.findByText(/already in your vocabulary/)).toBeTruthy();
    expect(vocab.create).toHaveBeenCalledTimes(1);
  });
});

describe('TutorScreen in Persian', () => {
  it('shows the Persian interface when the profile language is PR', async () => {
    useAuthStore.setState({ profile: { preferredLanguage: 'PR' } as UserProfile });
    await render(
      <QueryClientProvider client={new QueryClient()}>
        <I18nProvider>
          <TutorScreen />
        </I18nProvider>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('از چه چیزی شروع کنیم؟')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'ارسال' })).toBeTruthy();
    useAuthStore.setState({ profile: null });
  });
});
