import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/** Reachable unless the OS says otherwise; "unknown" (null) must not look like offline. */
export const isOffline = (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) =>
  s.isConnected === false || s.isInternetReachable === false;

/**
 * Tells TanStack Query when the device is (back) online - so stale and failed queries refetch on
 * reconnect - and returns whether to show the offline notice. Queries still run while offline
 * (networkMode 'always') and fail into the normal error states instead of hanging.
 */
export function useConnectivity(): { offline: boolean } {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((s) => setOnline(!isOffline(s))),
    );
    return NetInfo.addEventListener((s) => setOffline(isOffline(s)));
  }, []);
  return { offline };
}
