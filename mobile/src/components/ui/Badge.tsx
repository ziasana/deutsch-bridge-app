import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors, radius, spacing } from '@/theme';

type Tone = 'neutral' | 'primary' | 'success' | 'warning';

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.muted, fg: colors.mutedForeground },
  primary: { bg: colors.accent, fg: colors.primaryDark },
  success: { bg: colors.successSoft, fg: '#1B7A55' },
  warning: { bg: colors.warningSoft, fg: '#8A5A00' },
};

/** Small status label. Always carries text so meaning never relies on color alone. */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <AppText variant="caption" color={t.fg}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: radius.pill },
});
