import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { AppText, Button, HeroScreen } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/hooks';
import { useProgressOverview } from '@/features/progress/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import { featuredCards, topicCards, type FeaturedCard, type TopicCard } from './model';

const GREEN = '#2E8B57';

function Featured({ card, onPress }: { card: FeaturedCard; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.title}: ${card.headline} ${card.caption}`}
      onPress={onPress}
      style={({ pressed }) => [styles.featured, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.featuredText}>
        <AppText style={styles.featuredTitle} color="#FFFFFF">
          {card.title}
        </AppText>
        <AppText style={styles.featuredHeadline} color="#FFFFFF">
          {card.headline}
        </AppText>
        <AppText variant="small" color="#FFFFFF">
          {card.caption}
        </AppText>
      </View>
      <View style={styles.play}>
        <Ionicons name="caret-forward-outline" size={26} color={colors.primaryDark} />
      </View>
    </Pressable>
  );
}

function Topic({ card, onPress }: { card: TopicCard; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.title}, ${card.percent} Prozent`}
      onPress={onPress}
      style={({ pressed }) => [styles.topic, pressed && { backgroundColor: colors.accent }]}
    >
      <View style={[styles.emojiWrap, { backgroundColor: card.tint }]}>
        <AppText style={styles.emoji}>{card.emoji}</AppText>
      </View>
      <View style={styles.topicBody}>
        <AppText style={styles.topicTitle}>{card.title}</AppText>
        <View style={styles.barRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${card.percent}%` }]} />
          </View>
          <AppText variant="small" style={styles.pct}>
            {card.percent}%
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

/** Learn tab: greeting hero, today's highlights, and every learning area with its progress. */
export function LearnScreen() {
  const router = useRouter();
  const name = useAuthStore((s) => s.profile?.displayName);
  const overview = useProgressOverview();
  const dashboard = useDashboard();
  const refreshing = overview.isRefetching || dashboard.isRefetching;
  const refresh = () => {
    void overview.refetch();
    void dashboard.refetch();
  };

  return (
    <HeroScreen
      title={name ? `Hallo, ${name.split(' ')[0]}!` : 'Hallo!'}
      subtitle="Was möchtest du heute lernen?"
      sheetTitle="Deine Lerninhalte"
      refreshControl={
        <RefreshControl refreshing={refreshing && !overview.isPending} onRefresh={refresh} />
      }
    >
      <View style={styles.featuredRow}>
        {featuredCards(overview.data, dashboard.data).map((c) => (
          <Featured key={c.key} card={c} onPress={() => router.push(c.href)} />
        ))}
      </View>
      <View style={styles.list}>
        {topicCards(overview.data).map((c) => (
          <Topic key={c.key} card={c} onPress={() => router.push(c.href)} />
        ))}
      </View>
      {overview.isError ? (
        <View style={styles.error}>
          <AppText variant="small" color={colors.mutedForeground} center>
            Der Fortschritt konnte nicht geladen werden.
          </AppText>
          <Button label="Erneut versuchen" variant="ghost" onPress={refresh} />
        </View>
      ) : null}
    </HeroScreen>
  );
}

const styles = StyleSheet.create({
  featuredRow: { flexDirection: 'row', gap: spacing.md },
  featured: {
    flex: 1,
    minHeight: 150,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: GREEN,
  },
  featuredText: { flex: 1, gap: 2 },
  featuredTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  featuredHeadline: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
  play: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.md },
  topic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  emojiWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 30, lineHeight: 38 },
  topicBody: { flex: 1, gap: spacing.sm },
  topicTitle: { fontSize: 20, lineHeight: 26, fontWeight: '600', color: colors.ink },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#FBF1EA', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5, backgroundColor: '#5FD18A' },
  pct: { width: 38, textAlign: 'right', fontWeight: '600', color: colors.ink },
  error: { gap: spacing.xs },
});
