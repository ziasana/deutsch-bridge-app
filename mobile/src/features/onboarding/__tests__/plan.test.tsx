import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { userApi } from '@/api/userApi';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { OnboardingScreen } from '../OnboardingScreen';
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
  it('walks the steps, saves the plan and marks the profile completed', async () => {
    const saved = { displayName: 'Ali', onboardingCompleted: true } as UserProfile;
    api.completeOnboarding.mockResolvedValue(saved);
    useAuthStore.setState({
      status: 'authenticated',
      profile: { displayName: 'Ali', onboardingCompleted: false } as UserProfile,
    });
    const client = new QueryClient({ defaultOptions: { mutations: { gcTime: Infinity } } });
    await render(
      <QueryClientProvider client={client}>
        <OnboardingScreen />
      </QueryClientProvider>,
    );
    const press = (name: string) => fireEvent.press(screen.getByRole('radio', { name }));
    const check = (name: string) => fireEvent.press(screen.getByRole('checkbox', { name }));
    const next = () => fireEvent.press(screen.getByRole('button', { name: 'Weiter' }));

    expect(screen.getByRole('button', { name: 'Weiter' })).toBeDisabled();
    await press('English');
    await next();
    await check('Beruf & Karriere');
    await next();
    await press('Ich weiß es nicht');
    await next();
    await press('B2 · Gute Mittelstufe');
    await next();
    await press('10 Wörter');
    await next();
    await check('Grammatik');
    await fireEvent.press(screen.getByRole('button', { name: 'Lernplan starten' }));

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
    await waitFor(() => expect(useAuthStore.getState().profile?.onboardingCompleted).toBe(true));
  });
});
