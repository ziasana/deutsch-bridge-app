import { BACKEND_ORIGIN } from "@/lib/backendOrigin";

/** Resolves a relative backend-served audio URL (under /uploads etc.) to an absolute one. Already-absolute URLs pass through untouched. */
export function getVocabularyAudioSrc(audioUrl: string | null | undefined): string | null {
    if (!audioUrl) return null;
    return /^https?:\/\//.test(audioUrl) ? audioUrl : `${BACKEND_ORIGIN}${audioUrl}`;
}

/** Plays a word's pronunciation: the backend-provided audioUrl if present, otherwise falls back to
 *  the browser's SpeechSynthesis API (used for CUSTOM words with no recorded audio). */
export function playVocabularyAudio(audioUrl: string | null | undefined, word: string) {
    const src = getVocabularyAudioSrc(audioUrl);
    if (src) {
        new Audio(src).play().catch(() => {
            // Autoplay/network failures are non-critical here; the user can retry the tap.
        });
        return;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "de-DE";
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}
