import NetInfo from '@react-native-community/netinfo';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { OfflineBanner } from '../OfflineBanner';
import { isOffline, useConnectivity } from '../useConnectivity';

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0 }) }));

const net = NetInfo as unknown as { addEventListener: jest.Mock };

describe('connectivity', () => {
  it('treats unknown as online and only explicit failures as offline', () => {
    expect(isOffline({ isConnected: null, isInternetReachable: null })).toBe(false);
    expect(isOffline({ isConnected: true, isInternetReachable: null })).toBe(false);
    expect(isOffline({ isConnected: false, isInternetReachable: false })).toBe(true);
    expect(isOffline({ isConnected: true, isInternetReachable: false })).toBe(true);
  });

  it('follows the network state', async () => {
    let emit: (s: {
      isConnected: boolean | null;
      isInternetReachable: boolean | null;
    }) => void = () => {};
    net.addEventListener.mockImplementation((cb) => {
      emit = cb;
      return jest.fn();
    });
    const { result } = await renderHook(useConnectivity);
    expect(result.current.offline).toBe(false);
    await act(async () => emit({ isConnected: false, isInternetReachable: false }));
    expect(result.current.offline).toBe(true);
    await act(async () => emit({ isConnected: true, isInternetReachable: true }));
    expect(result.current.offline).toBe(false);
  });

  it('shows the notice only while offline', async () => {
    const { rerender } = await render(<OfflineBanner visible={false} />);
    expect(screen.queryByText('No internet connection')).toBeNull();
    await rerender(<OfflineBanner visible />);
    expect(screen.getByText('No internet connection')).toBeTruthy();
  });
});

describe('AppErrorBoundary', () => {
  it('offers a retry', async () => {
    const retry = jest.fn();
    await render(<AppErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText('Etwas ist schiefgelaufen')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));
    expect(retry).toHaveBeenCalled();
  });
});
