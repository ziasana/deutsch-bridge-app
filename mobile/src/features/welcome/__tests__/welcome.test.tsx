import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { WelcomeScreen } from '../WelcomeScreen';
import { slides } from '../slides';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('WelcomeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the pitch slides and the two entry points', async () => {
    await render(<WelcomeScreen />);
    expect(screen.getByText(slides[0].title)).toBeTruthy();
    expect(screen.getByText(slides[2].subtitle)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Registrieren' })).toBeTruthy();
  });

  it('routes to register and login', async () => {
    await render(<WelcomeScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Registrieren' }));
    expect(router.push).toHaveBeenLastCalledWith('/register');
    await fireEvent.press(screen.getByRole('button', { name: 'Anmelden' }));
    expect(router.push).toHaveBeenLastCalledWith('/login');
  });
});
