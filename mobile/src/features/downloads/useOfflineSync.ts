import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { isOffline } from '@/features/offline/useConnectivity';
import { outbox } from './outbox';

/**
 * Delivers progress queued while offline: at start, when the connection comes back and when the
 * app returns to the foreground. Refreshes the lists afterwards so counts match the server.
 */
export function useOfflineSync(): void {
  const queryClient = useQueryClient();
  useEffect(() => {
    const sync = async () => {
      if ((await outbox.flush()) > 0) void queryClient.invalidateQueries();
    };
    void sync();
    const net = NetInfo.addEventListener((s) => {
      if (!isOffline(s)) void sync();
    });
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    return () => {
      net();
      app.remove();
    };
  }, [queryClient]);
}
