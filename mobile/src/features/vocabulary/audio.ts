import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { resolveUploadUrl } from '@/utils/urls';

/**
 * Plays a word's pronunciation: the recorded audio when the backend has one, otherwise the
 * device's German voice (like the web app's speech-synthesis fallback).
 */
export function playWordAudio(audioUrl: string | null | undefined, word: string) {
  const src = resolveUploadUrl(audioUrl);
  if (src) {
    try {
      const player = createAudioPlayer(src);
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) player.remove();
      });
      player.play();
      return;
    } catch {
      // fall through to speech
    }
  }
  void Speech.stop();
  Speech.speak(word, { language: 'de-DE' });
}
