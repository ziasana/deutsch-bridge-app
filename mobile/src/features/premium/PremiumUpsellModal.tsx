import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { useI18n } from '@/i18n';
import { usePremiumUpsellStore } from '@/stores/premiumUpsellStore';
import { colors, radius, spacing } from '@/theme';

const PERKS = [
  { icon: 'chatbubbles-outline', title: 'perkLimits', hint: 'perkLimitsHint' },
  { icon: 'document-text-outline', title: 'perkFeedback', hint: 'perkFeedbackHint' },
  { icon: 'rocket-outline', title: 'perkPriority', hint: 'perkPriorityHint' },
] as const;

/**
 * Shown whenever a gated AI feature hits its daily limit (HTTP 429). Mounted once in the root
 * layout and driven by usePremiumUpsellStore, like the web PremiumUpsellModal.
 */
export function PremiumUpsellModal() {
  const { isOpen, close } = usePremiumUpsellStore();
  const router = useRouter();
  const { t, dir } = useI18n();
  const u = t.upsell;

  const upgrade = () => {
    close();
    router.push('/premium');
  };

  return (
    <Modal transparent visible={isOpen} animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={[styles.root, { direction: dir }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          style={StyleSheet.absoluteFill}
          onPress={close}
        />
        <View style={styles.card} accessibilityViewIsModal>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
            onPress={close}
            hitSlop={spacing.sm}
            style={styles.close}
          >
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </Pressable>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <View style={styles.crown}>
                <Ionicons name="trophy" size={30} color="#FFFFFF" />
              </View>
              <View style={styles.badge}>
                <AppText variant="caption" color={colors.primaryDark} style={{ fontWeight: '800' }}>
                  {u.badge.toUpperCase()}
                </AppText>
              </View>
              <AppText variant="heading" center accessibilityRole="header">
                {u.title}
              </AppText>
              <AppText color={colors.mutedForeground} center>
                {u.subtitle}
              </AppText>
            </View>

            <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '700' }}>
              {u.perksTitle.toUpperCase()}
            </AppText>
            <View style={{ gap: spacing.sm }}>
              {PERKS.map((p) => (
                <View key={p.title} style={styles.perk}>
                  <View style={styles.perkIcon}>
                    <Ionicons name={p.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontWeight: '700' }}>{u[p.title]}</AppText>
                    <AppText variant="small" color={colors.mutedForeground}>
                      {u[p.hint]}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>

            <Button label={u.upgrade} onPress={upgrade} />
            <Button label={u.later} variant="secondary" onPress={close} />
            <AppText variant="small" color={colors.mutedForeground} center>
              {u.resetNote}
            </AppText>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(0,0,0,0.45)' },
  card: {
    maxHeight: '92%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  close: { position: 'absolute', top: spacing.md, end: spacing.md, zIndex: 2 },
  content: { gap: spacing.md, padding: spacing.xl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  crown: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  perk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  perkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
});
