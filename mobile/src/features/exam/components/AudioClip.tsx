import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, ProgressBar } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

export const formatClock = (seconds: number) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** One listening clip: play/pause/replay with elapsed time. Plays even with the iPhone mute switch on. */
export function AudioClip({ src, label }: { src: string; label?: string }) {
  const player = useAudioPlayer(src);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const finished = status.duration > 0 && status.currentTime >= status.duration - 0.1;
  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (finished) void player.seekTo(0);
    player.play();
  };

  const name = label ? `Audio ${label}` : 'Audio';
  const action = status.playing ? 'Pause' : finished ? 'Nochmal hören' : 'Abspielen';
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}: ${action}`}
        onPress={toggle}
        disabled={!status.isLoaded}
        style={[styles.button, !status.isLoaded && { opacity: 0.5 }]}
      >
        <AppText color={colors.primaryForeground} style={styles.glyph}>
          {status.playing ? '❚❚' : finished ? '↻' : '▶'}
        </AppText>
      </Pressable>
      <View style={styles.track}>
        <ProgressBar
          value={status.currentTime}
          max={status.duration || 1}
          label={`${name} Fortschritt`}
        />
        <AppText variant="caption" color={colors.mutedForeground}>
          {status.isLoaded
            ? `${formatClock(status.currentTime)} / ${formatClock(status.duration)}`
            : 'Audio wird geladen …'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 16, fontWeight: '700' },
  track: { flex: 1, gap: spacing.xs },
});
