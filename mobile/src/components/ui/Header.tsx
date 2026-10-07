import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, spacing } from '@/theme';

type Props = { title: string; subtitle?: string; back?: boolean };

/** Screen header. `back` shows a back button for screens pushed above the tabs. */
export function Header({ title, subtitle, back }: Props) {
  const router = useRouter();
  const { t, isRTL } = useI18n();
  return (
    <View style={styles.wrap}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          onPress={() => router.back()}
          hitSlop={spacing.sm}
          style={styles.back}
        >
          <AppText variant="subheading" color={colors.primaryDark}>
            {isRTL ? '›' : '‹'} {t.common.back}
          </AppText>
        </Pressable>
      ) : null}
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? <AppText color={colors.mutedForeground}>{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  back: { minHeight: MIN_TOUCH - 8, justifyContent: 'center', alignSelf: 'flex-start' },
});
