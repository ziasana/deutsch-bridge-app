import { I18nProvider, dictionaries } from '@/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { userApi } from '@/api/userApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { OnboardingScreen } from '../OnboardingScreen';
import { useOnboardingStore } from '../store';
import {
  initialPlan,
  isStepValid,
  parseGermanDate,
  stepsFor,
  toRequest,
  type PlanState,
} from '../plan';

jest.mock('@/api/userApi');
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const api = userApi as jest.Mocked<typeof userApi>;
const plan = (p: Partial<PlanState>): PlanState => ({ ...initialPlan, ...p });

describe('learning plan logic', () => {
  it('adds the exam step only for exam preparers', () => {
    expect(stepsFor(plan({ reasons: ['WORK'] }))).not.toContain('exam');
    expect(stepsFor(plan({ reasons: ['WORK', 'EXAM'] })).at(-1)).toBe('exam');
  });

  it('parses real German dates only', () => {
    expect(parseGermanDate('31.12.2026')).toBe('2026-12-31');
    expect(parseGermanDate('5.3.2027')).toBe('2027-03-05');
    expect(parseGermanDate('31.02.2026')).toBeNull();
    expect(parseGermanDate('2026-12-31')).toBeNull();
  });

  it('validates steps', () => {
    expect(isStepValid('reason', plan({}))).toBe(false);
    expect(isStepValid('currentLevel', plan({ currentLevelUnknown: true }))).toBe(true);
    expect(
      isStepValid('focus', plan({ focus: ['GRAMMAR', 'READING', 'WRITING', 'SPEAKING'] })),
    ).toBe(false);
    const today = new Date('2026-06-01');
    const exam = plan({
      examType: 'TELC',
      examLevel: 'B1',
      hasExamDate: true,
      examDateText: '01.01.2026',
    });
    expect(isStepValid('exam', exam, today)).toBe(false);
    expect(isStepValid('exam', { ...exam, examDateText: '01.09.2026' }, today)).toBe(true);
  });

  it('builds the backend request, dropping exam fields for non-exam learners', () => {
    const base = plan({
      language: 'EN',
      reasons: ['WORK'],
      currentLevelUnknown: true,
      targetLevel: 'B2',
      dailyWords: 10,
      focus: ['GRAMMAR'],
      examType: 'TELC',
      examLevel: 'B1',
    });
    expect(toRequest(base)).toEqual({
      preferredLanguage: 'EN',
      learningReasons: ['WORK'],
      currentLevel: null,
      currentLevelUnknown: true,
      targetLevel: 'B2',
      dailyGoalWords: 10,
      focusAreas: ['GRAMMAR'],
      examType: null,
      examLevel: null,
      examDate: null,
    });
  });
});

describe('OnboardingScreen', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('walks the steps like the web wizard, saves, shows the summary, then opens the app', async () => {
    const saved = {
      displayName: 'Ali',
      email: 'ali@example.com',
      onboardingCompleted: true,
    } as UserProfile;
    api.completeOnboarding.mockResolvedValue(saved);
    useAuthStore.setState({
      status: 'authenticated',
      profile: {
        displayName: 'Ali',
        email: 'ali@example.com',
        onboardingCompleted: false,
      } as UserProfile,
    });
    const client = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
    await render(
      <QueryClientProvider client={client}>
        <OnboardingScreen />
      </QueryClientProvider>,
    );
    const press = (name: string) => fireEvent.press(screen.getByRole('radio', { name }));
    const check = (name: string) => fireEvent.press(screen.getByRole('checkbox', { name }));
    const next = () => fireEvent.press(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('In which language should we explain German?')).toBeTruthy();
    expect(screen.getByText('Step 1 of 6')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await press('English');
    await next();
    await check('Work & career');
    await next();
    await press('A2 · Elementary');
    await next();
    // Target must lie above the current level.
    expect(screen.getByRole('radio', { name: 'A1 · Beginner' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'A2 · Elementary' })).toBeDisabled();
    await press('B2 · Upper intermediate');
    await next();
    // 5 words/day is preselected, so the step is already valid.
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    await press('10 words per day, Balanced');
    await next();
    await check('Grammar');
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() =>
      expect(api.completeOnboarding).toHaveBeenCalledWith(
        expect.objectContaining({
          preferredLanguage: 'EN',
          targetLevel: 'B2',
          dailyGoalWords: 10,
          focusAreas: ['GRAMMAR'],
        }),
      ),
    );
    // The profile only flips after the learner leaves the summary screen.
    expect(await screen.findByText('Your learning plan is ready!')).toBeTruthy();
    expect(useAuthStore.getState().profile?.onboardingCompleted).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Start learning' }));
    expect(useAuthStore.getState().profile?.onboardingCompleted).toBe(true);
  });

  it('keeps answers per account and resets for a different one', async () => {
    useOnboardingStore.getState().ensureOwner('a@example.com');
    useOnboardingStore.getState().patch({ language: 'PR' });
    useOnboardingStore.getState().ensureOwner('a@example.com');
    expect(useOnboardingStore.getState().language).toBe('PR');
    useOnboardingStore.getState().ensureOwner('b@example.com');
    expect(useOnboardingStore.getState().language).toBeNull();
  });
});

describe('OnboardingScreen language', () => {
  beforeEach(() => useOnboardingStore.getState().reset());

  it('starts in English and switches to Persian as soon as Persian is picked', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      profile: {
        displayName: 'Ali',
        email: 'ali@example.com',
        onboardingCompleted: false,
      } as UserProfile,
    });
    const client = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
    await render(
      <QueryClientProvider client={client}>
        <I18nProvider>
          <OnboardingScreen />
        </I18nProvider>
      </QueryClientProvider>,
    );
    const fa = dictionaries.fa.entry.onboarding;
    expect(await screen.findByText('In which language should we explain German?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'فارسی' }));
    expect(await screen.findByText(fa.steps.language.title)).toBeTruthy();
    expect(screen.getByRole('button', { name: dictionaries.fa.entry.common.next })).toBeTruthy();
  });
});
