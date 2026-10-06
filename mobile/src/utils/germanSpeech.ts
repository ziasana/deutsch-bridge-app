import * as Speech from 'expo-speech';

/** Voices that sound best on iOS / Android for German, tried in this order after quality. */
const PREFERRED_NAMES = ['anna', 'petra', 'helena', 'markus', 'viktor', 'yannick'];

type Voice = { identifier: string; name: string; language: string; quality?: string };

let voice: Promise<string | undefined> | null = null;

const isGerman = (v: Voice) => v.language.replace('_', '-').toLowerCase().startsWith('de-de');

/**
 * The most natural German (Germany) voice installed on the device: Premium/Enhanced voices first,
 * then well-known native voices. Without this the system may read German with its default voice.
 * Resolves to undefined when none can be determined (the language setting still applies).
 */
export function germanVoice(): Promise<string | undefined> {
  voice ??= (async () => {
    try {
      const all = ((await Speech.getAvailableVoicesAsync()) as Voice[]).filter(isGerman);
      const score = (v: Voice) => {
        const name = v.name.toLowerCase();
        const preferred = PREFERRED_NAMES.findIndex((n) => name.includes(n));
        return (
          (v.quality === 'Enhanced' ? 100 : 0) +
          (/premium/i.test(v.name) ? 50 : 0) +
          (preferred >= 0 ? 10 - preferred : 0)
        );
      };
      return [...all].sort((a, b) => score(b) - score(a))[0]?.identifier;
    } catch {
      return undefined;
    }
  })();
  return voice;
}

const EXPAND: [RegExp, string][] = [
  [/\bz\.\s?B\./g, 'zum Beispiel'],
  [/\bd\.\s?h\./g, 'das heißt'],
  [/\busw\./g, 'und so weiter'],
  [/\bbzw\./g, 'beziehungsweise'],
  [/\bca\./g, 'circa'],
  [/\bu\.\s?a\./g, 'unter anderem'],
  [/\bggf\./g, 'gegebenenfalls'],
  [/\bz\.\s?T\./g, 'zum Teil'],
  [/\bEUR\b|€/g, 'Euro'],
  [/&/g, ' und '],
  [/\((\d{1,2})\)/g, ' Lücke $1. '],
];

/** Writes abbreviations and markers out so the voice reads them the way a German speaker would. */
export const forSpeech = (text: string) =>
  EXPAND.reduce((t, [re, to]) => t.replace(re, to), text.replace(/\*\*|__/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

/** Paragraphs become separate utterances: natural pauses, and no engine limit on long texts. */
export const speechChunks = (text: string): string[] =>
  text
    .split(/\n+/)
    .map(forSpeech)
    .filter((c) => /[\p{L}\d]/u.test(c));

/**
 * Reads German text aloud, paragraph by paragraph, with the best German voice available.
 * Returns a function that stops it.
 */
export function speakGerman(
  text: string,
  handlers: { onDone: () => void; onError: () => void },
): () => void {
  const chunks = speechChunks(text);
  let cancelled = false;
  let i = 0;
  const next = (voiceId: string | undefined) => {
    if (cancelled) return;
    if (i >= chunks.length) {
      handlers.onDone();
      return;
    }
    Speech.speak(chunks[i++], {
      language: 'de-DE',
      voice: voiceId,
      rate: 0.95,
      pitch: 1,
      onDone: () => next(voiceId),
      onError: () => {
        if (!cancelled) handlers.onError();
      },
    });
  };
  void germanVoice().then(next);
  return () => {
    cancelled = true;
    void Speech.stop();
  };
}
