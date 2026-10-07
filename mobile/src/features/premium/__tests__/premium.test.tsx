import { fireEvent, render, screen } from '@testing-library/react-native';
import { I18nProvider } from '@/i18n';
import { usePremiumUpsellStore } from '@/stores/premiumUpsellStore';
import { PremiumScreen } from '../PremiumScreen';
import { PremiumUpsellModal } from '../PremiumUpsellModal';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  mockPush.mockReset();
  usePremiumUpsellStore.setState({ isOpen: false, message: null });
});

describe('PremiumUpsellModal', () => {
  it('is hidden until a limit is reached', async () => {
    await render(<PremiumUpsellModal />);
    expect(screen.queryByText("You've reached today's limit")).toBeNull();
  });

  it('opens on a limit, goes to the premium page and closes', async () => {
    await render(<PremiumUpsellModal />);
    usePremiumUpsellStore.getState().open('Daily limit reached');
    expect(await screen.findByText("You've reached today's limit")).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Upgrade to Premium' }));
    expect(mockPush).toHaveBeenCalledWith('/premium');
    expect(usePremiumUpsellStore.getState().isOpen).toBe(false);
  });

  it('"Maybe later" just closes', async () => {
    await render(<PremiumUpsellModal />);
    usePremiumUpsellStore.getState().open();
    await fireEvent.press(await screen.findByRole('button', { name: 'Maybe later' }));
    expect(usePremiumUpsellStore.getState().isOpen).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe('PremiumScreen', () => {
  it('lists the Basic → Premium allowance per AI feature', async () => {
    await render(
      <I18nProvider>
        <PremiumScreen />
      </I18nProvider>,
    );
    expect(screen.getByText('AI Chat')).toBeTruthy();
    expect(screen.getByText('Go Premium')).toBeTruthy();
  });
});
