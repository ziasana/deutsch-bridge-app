import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Header, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

/** Daily AI allowance per feature: Basic → Premium (same numbers as the web /premium page). */
const FEATURES = [
  { key: 'chat', icon: 'chatbubble-ellipses-outline', basic: 5, premium: 100 },
  { key: 'correction', icon: 'checkmark-done-outline', basic: 3, premium: 50 },
  { key: 'examples', icon: 'color-wand-outline', basic: 5, premium: 100 },
  { key: 'synonyms', icon: 'sparkles-outline', basic: 5, premium: 100 },
] as const;

/**
 * "Go Premium" page the upsell modal leads to. There is no checkout yet: an admin switches the
 * account type, exactly like on the web.
 */
export function PremiumScreen() {
  const router = useRouter();
  const { t, isRTL } = useI18n();
  const p = t.premium;
  return (
    <Screen>
      <Header title={p.title} back />
      <View style={styles.hero}>
        <View style={styles.bolt}>
          <Ionicons name="flash" size={30} color={colors.primary} />
        </View>
        <AppText variant="heading" center>
          {p.heading}
        </AppText>
        <AppText color={colors.mutedForeground} center>
          {p.intro}
        </AppText>
      </View>

      {FEATURES.map((f) => (
        <Card key={f.key} style={styles.feature}>
          <View style={styles.icon}>
            <Ionicons name={f.icon} size={22} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontWeight: '700' }}>{p.features[f.key].title}</AppText>
            <AppText variant="small" color={colors.mutedForeground}>
              {p.features[f.key].amount(f.basic)}
              {isRTL ? '  ←  ' : '  →  '}
              <AppText variant="small" color={colors.primary} style={{ fontWeight: '700' }}>
                {p.features[f.key].amount(f.premium)}
              </AppText>
            </AppText>
          </View>
        </Card>
      ))}

      <Card style={{ gap: spacing.md }}>
        <AppText color={colors.mutedForeground} center>
          {p.notOpen}
        </AppText>
        <Button label={t.common.back} variant="secondary" onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  bolt: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
});
