import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { examSimulationApi } from '@/api/examSimulationApi';
import { AppText, Button, ProgressBar } from '@/components/ui';
import { AudioClip } from '@/features/exam/components/AudioClip';
import { tint } from '@/features/exam/components/kit';
import { colors, radius, spacing } from '@/theme';
import { formatClock, simulationErrorMessage } from '../format';

type Props = {
  attemptId: string;
  partKey: string;
  passageId: string;
  label: string;
  src: string;
  /** Plays allowed for this clip; null = unlimited (the normal clip player). */
  maxPlays: number | null;
  initialPlaysUsed: number;
  disabled: boolean;
  color: string;
};

/** The clip plays once, without pause or seeking back - like the real exam. */
function OncePlayer({ src, color, onEnded }: { src: string; color: string; onEnded: () => void }) {
  const player = useAudioPlayer(src);
  const status = useAudioPlayerStatus(player);
  const started = useRef(false);
  const ended = useRef(false);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);
  useEffect(() => {
    if (status.isLoaded && !started.current) {
      started.current = true;
      player.play();
    }
  }, [status.isLoaded, player]);
  useEffect(() => {
    const done = status.didJustFinish || (started.current && status.duration > 0 && status.currentTime >= status.duration - 0.1 && !status.playing);
    if (done && !ended.current) {
      ended.current = true;
      onEnded();
    }
  }, [status, onEnded]);

  return (
    <View style={[styles.box, { backgroundColor: tint(color, '14') }]} accessibilityLiveRegion="polite">
      <View style={styles.row}>
        <Ionicons name="volume-high" size={22} color={color} />
        <AppText style={{ flex: 1, fontWeight: '700' }}>Wiedergabe läuft …</AppText>
        <AppText variant="small" color={colors.mutedForeground} style={{ fontVariant: ['tabular-nums'] }}>
          {status.isLoaded ? `${formatClock(status.currentTime)} / ${formatClock(status.duration)}` : 'lädt …'}
        </AppText>
      </View>
      <ProgressBar value={status.currentTime} max={status.duration || 1} color={color} label="Audio Fortschritt" />
    </View>
  );
}

/**
 * Listening clip of the exam. Without a limit it is the normal clip player; with a limit every play is first counted on
 * the server (a restart of the app cannot give plays back), then plays once, and the card shows the plays that remain.
 */
export function SimAudio({ attemptId, partKey, passageId, label, src, maxPlays, initialPlaysUsed, disabled, color }: Props) {
  const [used, setUsed] = useState(initialPlaysUsed);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (maxPlays == null) return <AudioClip key={src} src={src} label={label} />;
  if (playing) return <OncePlayer key={`${src}-${used}`} src={src} color={color} onEnded={() => setPlaying(false)} />;

  const remaining = Math.max(0, maxPlays - used);
  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await examSimulationApi.playAudio(attemptId, partKey, passageId);
      setUsed(res.playsUsed);
      setPlaying(true);
    } catch (e) {
      setError(simulationErrorMessage(e, 'Die Audiodatei kann nicht abgespielt werden.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.box, { backgroundColor: tint(color, '14') }]}>
      <AppText variant="small">
        {remaining > 0
          ? `Dieser Text wird ${maxPlays === 1 ? 'einmal' : `${maxPlays}-mal`} abgespielt. Noch ${remaining} ${remaining === 1 ? 'Wiedergabe' : 'Wiedergaben'}.`
          : 'Dieser Text kann nicht mehr abgespielt werden.'}
      </AppText>
      {error ? (
        <AppText variant="small" color={colors.destructive} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
      <Button
        pill
        label={used === 0 ? 'Abspielen' : 'Nochmal abspielen'}
        color={color}
        loading={busy}
        disabled={disabled || remaining === 0}
        onPress={() => void start()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
