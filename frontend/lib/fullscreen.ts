/** Browser fullscreen helpers for the exam. Both are best-effort: browsers refuse without a user gesture or when unsupported. */

export function enterFullscreen(): void {
    if (typeof document === "undefined" || document.fullscreenElement) return;
    try {
        void document.documentElement.requestFullscreen?.().catch(() => undefined);
    } catch {
        // Unsupported or refused: the exam still runs, just without the browser's fullscreen.
    }
}

export function exitFullscreen(): void {
    if (typeof document === "undefined" || !document.fullscreenElement) return;
    try {
        void document.exitFullscreen?.().catch(() => undefined);
    } catch {
        // Already left (for example with Esc).
    }
}
