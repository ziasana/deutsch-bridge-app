import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { colors, radius, shadow, spacing } from '@/theme';
import type { ExpressionListItem } from '@/types/expression';
import { resolveUploadUrl } from '@/utils/urls';
import { useToggleExpressionBookmark } from '../hooks';
import { EXPRESSION_COLOR, EXPRESSION_DARK, MASTERY_COLOR, TYPE_EMOJI } from '../labels';
import { meaningLine } from '../practiceLogic';
import { MasteryDots } from './ExpressionViz';

type Props = { item: ExpressionListItem; onPress: () => void };

/** One expression as a card: picture (or emoji), phrase, meaning, level, mastery dots and a star you can tap. */
export function ExpressionRow({ item, onPress }: Props) {
  const image = resolveUploadUrl(item.imageUrl);
  const bookmark = useToggleExpressionBookmark(item.id);
  const color = MASTERY_COLOR[item.masteryLevel];
  const meaning = meaningLine(item.meaningDe, item.meaningEn);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${item.expression}${meaning ? `, ${meaning}` : ''}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={[styles.accent, { backgroundColor: color }]} />
      {image ? (
        <Image
          source={{ uri: image }}
          contentFit="cover"
          style={styles.thumb}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.thumb, styles.emoji, { backgroundColor: tint(color, '1F') }]}>
          <AppText style={{ fontSize: 26, lineHeight: 34 }}>{TYPE_EMOJI.REDEWENDUNG}</AppText>
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="subheading">{item.expression}</AppText>
        {meaning ? (
          <AppText variant="small" color={colors.mutedForeground} numberOfLines={2}>
            {meaning}
          </AppText>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.level}>
            <AppText variant="caption" color={EXPRESSION_DARK} style={{ fontWeight: '800' }}>
              {item.level}
            </AppText>
          </View>
          <MasteryDots level={item.masteryLevel} />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.bookmarked ? 'Gemerkt' : 'Merken'}
        accessibilityState={{ busy: bookmark.isPending }}
        disabled={bookmark.isPending}
        onPress={() => bookmark.mutate(item.bookmarked)}
        hitSlop={spacing.sm}
        style={styles.star}
      >
        <Ionicons
          name={item.bookmarked ? 'star' : 'star-outline'}
          size={22}
          color={item.bookmarked ? colors.warning : colors.mutedForeground}
        />
      </Pressable>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.muted },
  emoji: { alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  level: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: tint(EXPRESSION_COLOR, '1F'),
  },
  star: { padding: spacing.xs },
});
