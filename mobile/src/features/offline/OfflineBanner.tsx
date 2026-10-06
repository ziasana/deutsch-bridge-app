import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/** A small floating notice; it never blocks touches on the screen underneath. */
export function OfflineBanner({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + spacing.xs }]}>
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.pill}>
        <AppText variant="small" color={colors.primaryForeground}>
          {t.common.noConnection}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  pill: {
    backgroundColor: colors.foreground,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});
