export const CORRECT_MESSAGES = ["Richtig! 🎉", "Genau! 👏", "Super gemacht! ⭐", "Stark! 💪", "Perfekt! ✅"];
export const WRONG_MESSAGES = ["Fast! Schau dir die Erklärung an.", "Nicht ganz – so merkst du es dir.", "Kein Problem – das lernst du jetzt."];

export function pickMessage(messages: readonly string[], salt: number): string {
    return messages[salt % messages.length];
}

/** A short light vibration on phones; silently ignored where unsupported. */
export function haptic(ms = 12) {
    try {
        navigator.vibrate?.(ms);
    } catch {
        /* ignore */
    }
}
