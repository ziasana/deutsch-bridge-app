import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Display-only countdown. The server sends its own clock (`serverNowMs`) with the deadline; the remaining time is that
 * clock plus the time elapsed since the response arrived (a monotonic timer, so changing the phone's clock changes
 * nothing). When it reaches zero `onExpire` fires once so the screen can ask the server what happens next.
 */
export function useServerCountdown(
  deadlineMs: number | null,
  serverNowMs: number,
  onExpire: () => void,
): { remainingSeconds: number } {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    deadlineMs == null ? 0 : Math.max(0, Math.ceil((deadlineMs - serverNowMs) / 1000)),
  );
  const expireRef = useRef(onExpire);
  const firedFor = useRef<number | null>(null);
  useEffect(() => {
    expireRef.current = onExpire;
  });

  useEffect(() => {
    if (deadlineMs == null) return;
    const anchorPerf = performance.now();
    const tick = () => {
      const serverNow = serverNowMs + (performance.now() - anchorPerf);
      const remaining = Math.max(0, Math.ceil((deadlineMs - serverNow) / 1000));
      setRemainingSeconds(remaining);
      if (remaining <= 0 && firedFor.current !== deadlineMs) {
        firedFor.current = deadlineMs;
        expireRef.current();
      }
    };
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 500);
    // A backgrounded app may have been suspended: recompute at once when it returns.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && tick());
    return () => {
      clearTimeout(first);
      clearInterval(id);
      sub.remove();
    };
  }, [deadlineMs, serverNowMs]);

  return { remainingSeconds };
}
