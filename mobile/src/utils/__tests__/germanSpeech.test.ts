import * as Speech from 'expo-speech';
import { forSpeech, germanVoice, speakGerman, speechChunks } from '../germanSpeech';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
  getAvailableVoicesAsync: jest.fn(),
}));

describe('forSpeech', () => {
  it('writes abbreviations and gap markers out for the voice', () => {
    expect(forSpeech('Das kostet ca. 5 € z. B. im Monat.')).toBe(
      'Das kostet circa 5 Euro zum Beispiel im Monat.',
    );
    expect(forSpeech('Ich freue mich **(21)** dein Besuch.')).toBe('Ich freue mich Lücke 21. dein Besuch.');
  });

  it('splits paragraphs into separate utterances and drops empty ones', () => {
    expect(speechChunks('Eins.\n\n  \nZwei.\n–')).toEqual(['Eins.', 'Zwei.']);
  });
});

describe('speakGerman', () => {
  it('picks the best German voice and reads paragraph by paragraph', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      { identifier: 'en', name: 'Samantha', language: 'en-US', quality: 'Enhanced' },
      { identifier: 'de-default', name: 'Markus', language: 'de-DE', quality: 'Default' },
      { identifier: 'de-enhanced', name: 'Anna', language: 'de-DE', quality: 'Enhanced' },
    ]);
    const done = jest.fn();
    speakGerman('Eins.\nZwei.', { onDone: done, onError: jest.fn() });
    await germanVoice();
    await new Promise((r) => setTimeout(r, 0));

    expect(Speech.speak).toHaveBeenCalledTimes(1);
    expect(Speech.speak).toHaveBeenLastCalledWith(
      'Eins.',
      expect.objectContaining({ language: 'de-DE', voice: 'de-enhanced' }),
    );
    (Speech.speak as jest.Mock).mock.calls[0][1].onDone();
    expect(Speech.speak).toHaveBeenLastCalledWith('Zwei.', expect.anything());
    (Speech.speak as jest.Mock).mock.calls[1][1].onDone();
    expect(done).toHaveBeenCalled();
  });

  it('stops without reading on', async () => {
    (Speech.speak as jest.Mock).mockClear();
    const stop = speakGerman('Eins.\nZwei.', { onDone: jest.fn(), onError: jest.fn() });
    await germanVoice();
    await new Promise((r) => setTimeout(r, 0));
    stop();
    (Speech.speak as jest.Mock).mock.calls[0][1].onDone();
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    expect(Speech.stop).toHaveBeenCalled();
  });
});
