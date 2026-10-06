import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { AppText, Button, HeroScreen, ProgressRing } from '@/components/ui';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { LearnIllustration } from '@/components/ui/HeroIllustrations';
import { useDashboard } from '@/features/dashboard/hooks';
import { useProgressOverview } from '@/features/progress/hooks';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import { featuredCards, topicCards, type FeaturedCard, type TopicCard } from './model';

const DAILY_COLOR = '#F59E0B';
const REVIEW_COLOR = '#4D94FF';

/** Today's highlight: a coloured card with a ring (when it has progress), a big number and a play button. */
function Featured({ card, onPress }: { card: FeaturedCard; onPress: () => void }) {
  const color = card.key === 'daily' ? DAILY_COLOR : REVIEW_COLOR;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${card.title}: ${card.headline} ${card.caption}`}
      onPress={onPress}
      containerStyle={{ flex: 1 }}
      style={[styles.featured, { backgroundColor: color }]}
    >
      <View style={styles.featuredDeco} pointerEvents="none" />
      <View style={styles.featuredTop}>
        <AppText style={styles.featuredTitle} color="#FFFFFF">
          {card.key === 'daily' ? '🌅 ' : '🗂️ '}
          {card.title}
        </AppText>
      </View>
      <View style={styles.featuredBottom}>
        <View style={{ flex: 1 }}>
          <AppText style={styles.featuredHeadline} color="#FFFFFF">
            {card.headline}
          </AppText>
          <AppText variant="small" color="#FFFFFFE6">
            {card.caption}
          </AppText>
          {card.progress != null ? (
            <View style={styles.featuredTrack}>
              <View style={[styles.featuredFill, { width: `${card.progress}%` }]} />
            </View>
          ) : null}
        </View>
        <View style={styles.play}>
          <Ionicons
            name="play"
            size={22}
            color={color === DAILY_COLOR ? '#B26B00' : colors.primaryDark}
          />
        </View>
      </View>
    </PressableScale>
  );
}

/** A learning area as a tile: accent colour, emoji, ring with the percentage, what it is, and x / y. */
function Topic({ card, onPress }: { card: TopicCard; onPress: () => void }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${card.title}, ${card.percent} Prozent`}
      onPress={onPress}
      containerStyle={styles.topicWrap}
      style={[
        styles.topic,
        { backgroundColor: tint(card.color, '14'), borderColor: tint(card.color, '33') },
      ]}
    >
      <View style={styles.topicTop}>
        <View style={[styles.emojiWrap, { backgroundColor: tint(card.color, '33') }]}>
          <AppText style={styles.emoji}>{card.emoji}</AppText>
        </View>
        <ProgressRing
          value={card.percent}
          size={52}
          stroke={6}
          textSize={12}
          color={card.color}
          trackColor="#FFFFFFCC"
          label={`${card.title} Fortschritt`}
        />
      </View>
      <View style={{ gap: 2 }}>
        <AppText
          style={styles.topicTitle}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {card.title}
        </AppText>
        <AppText variant="small" color={colors.mutedForeground} numberOfLines={2}>
          {card.subtitle}
        </AppText>
      </View>
      <View style={styles.topicFoot}>
        <AppText variant="caption" color={colors.ink} style={{ fontWeight: '800' }}>
          {card.detail}
        </AppText>
        <Ionicons name="arrow-forward-circle" size={22} color={card.color} />
      </View>
    </PressableScale>
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
      art={<LearnIllustration />}
      title={name ? `Hallo, ${name.split(' ')[0]}!` : 'Hallo!'}
      subtitle="Was möchtest du heute lernen?"
      sheetTitle="Deine Lerninhalte"
      refreshControl={
        <RefreshControl refreshing={refreshing && !overview.isPending} onRefresh={refresh} />
      }
    >
      <AppText style={styles.sectionTitle} accessibilityRole="header">
        Heute
      </AppText>
      <View style={styles.featuredRow}>
        {featuredCards(overview.data, dashboard.data).map((c) => (
          <Featured key={c.key} card={c} onPress={() => router.push(c.href)} />
        ))}
      </View>
      <AppText style={styles.sectionTitle} accessibilityRole="header">
        Lernbereiche
      </AppText>
      <View style={styles.grid}>
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
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  featuredRow: { flexDirection: 'row', gap: spacing.md },
  featured: {
    minHeight: 168,
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: 24,
    overflow: 'hidden',
  },
  featuredDeco: {
    position: 'absolute',
    right: -30,
    top: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  featuredTop: { flexDirection: 'row' },
  featuredTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  featuredBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  featuredHeadline: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  featuredTrack: {
    height: 6,
    marginTop: spacing.sm,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  featuredFill: { height: '100%', borderRadius: 3, backgroundColor: '#FFFFFF' },
  play: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  topicWrap: { width: '47.5%', flexGrow: 1 },
  topic: { gap: spacing.md, padding: spacing.md, borderRadius: 24, borderWidth: 1.5 },
  topicTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 28, lineHeight: 34 },
  topicTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: colors.ink },
  topicFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  error: { gap: spacing.xs },
});
