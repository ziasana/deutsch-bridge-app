import { fireEvent, render, screen } from '@testing-library/react-native';
import { ApiError } from '@/api/errors';
import NotFoundRoute from '@/app/+not-found';
import { EmptyState, ErrorState } from '..';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('illustrated states', () => {
  it('shows the no-connection page with a retry for network errors', async () => {
    const retry = jest.fn();
    await render(
      <ErrorState
        error={new ApiError('network', 'Keine Verbindung. Bitte versuche es erneut.')}
        onRetry={retry}
      />,
    );
    expect(screen.getByText('Nicht verbunden')).toBeTruthy();
    expect(screen.getByText('Keine Verbindung. Bitte versuche es erneut.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(retry).toHaveBeenCalled();
  });

  it('shows the not-found page for 404 errors, without a pointless retry', async () => {
    await render(
      <ErrorState
        error={new ApiError('notFound', 'Dieser Inhalt wurde nicht gefunden.', 404)}
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByText('Nicht gefunden')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Erneut versuchen' })).toBeNull();
  });

  it('keeps the plain message for other errors', async () => {
    await render(
      <ErrorState error={new ApiError('server', 'Der Server ist gerade nicht erreichbar.')} />,
    );
    expect(screen.getByText('Der Server ist gerade nicht erreichbar.')).toBeTruthy();
    expect(screen.queryByText('Nicht verbunden')).toBeNull();
  });

  it('uses the not-found picture for empty search results and keeps the action', async () => {
    const reset = jest.fn();
    await render(
      <EmptyState
        emoji="🔍"
        title="Keine Treffer"
        message="Passe die Suche an."
        actionLabel="Filter zurücksetzen"
        onAction={reset}
      />,
    );
    expect(screen.getByText('Keine Treffer')).toBeTruthy();
    expect(screen.queryByText('🔍')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Filter zurücksetzen' }));
    expect(reset).toHaveBeenCalled();
  });

  it('has a not-found route that leads home', async () => {
    await render(<NotFoundRoute />);
    expect(screen.getByText('Seite nicht gefunden')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Zur Startseite' }));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});
