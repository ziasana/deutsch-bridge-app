import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, DirectionalIcon } from '@/components/ui';
import { PressableScale } from '@/features/exam/components/kit';
import { useI18n } from '@/i18n';
import { colors, radius, shadow, spacing } from '@/theme';
import type { VocabularyItem } from '@/types/vocabulary';
import { playWordAudio } from '../audio';
import { ARTICLE_COLOR, MASTERY_COLOR, SOURCE_ICON, masteryOf, wordLabel } from '../listLogic';
import { MasteryDots } from './VocabularyViz';

type Props = {
  item: VocabularyItem;
  onOpen: () => void;
  onPractice: () => void;
  onToggleBookmark: () => void;
  /** Words saved from the dictionary can't be edited or deleted here (they follow the dictionary entry). */
  onEdit?: () => void;
  onDelete?: () => void;
};

function IconAction({
  name,
  label,
  onPress,
  color = colors.mutedForeground,
  active,
}: {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      hitSlop={spacing.xs}
      style={[
        styles.iconBtn,
        active && { backgroundColor: colors.accent, borderColor: colors.accent },
      ]}
    >
      <Ionicons name={name} size={19} color={color} />
    </Pressable>
  );
}

/** One word as a card: article-coloured edge, word, meaning, example, mastery and quick actions. */
export function WordCard({ item, onOpen, onPractice, onToggleBookmark, onEdit, onDelete }: Props) {
  const { t } = useI18n();
  const v = t.vocabulary;
  const mastery = masteryOf(item);
  const edge = item.article
    ? (ARTICLE_COLOR[item.article] ?? MASTERY_COLOR[mastery])
    : MASTERY_COLOR[mastery];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${wordLabel(item)}, ${item.meaning}`}
      onPress={onOpen}
      style={styles.card}
    >
      <View style={[styles.edge, { backgroundColor: edge }]} />
      <View style={styles.head}>
        <View style={styles.tags}>
          {item.level ? (
            <View style={styles.level}>
              <AppText variant="caption" color={colors.primaryDark} style={{ fontWeight: '800' }}>
                {item.level}
              </AppText>
            </View>
          ) : null}
          <View style={styles.source}>
            <Ionicons name={SOURCE_ICON[item.source]} size={12} color={colors.mutedForeground} />
            <AppText variant="caption" color={colors.mutedForeground}>
              {v.sources[item.source]}
            </AppText>
          </View>
        </View>
        <MasteryDots level={mastery} />
      </View>

      <View style={{ gap: 2, alignItems: 'flex-start' }}>
        <AppText style={styles.word}>{wordLabel(item)}</AppText>
        <AppText color={colors.mutedForeground}>{item.meaning}</AppText>
      </View>

      {item.example ? (
        <View style={styles.example}>
          <AppText variant="small" color={colors.ink} style={{ fontStyle: 'italic' }}>
            „{item.example}“
          </AppText>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={v.practiseItem(wordLabel(item))}
          onPress={onPractice}
          style={styles.practice}
        >
          <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '800' }}>
            {v.practiceShort}
          </AppText>
          <DirectionalIcon name="arrow-forward" size={14} color={colors.primaryDark} />
        </Pressable>
        <IconAction
          name="volume-high-outline"
          label={v.listenItem(wordLabel(item))}
          color={colors.primaryDark}
          onPress={() => playWordAudio(item.audioUrl, item.word)}
        />
        <IconAction
          name={item.bookmarked ? 'star' : 'star-outline'}
          label={item.bookmarked ? v.saved : v.save}
          color={item.bookmarked ? colors.warning : colors.mutedForeground}
          active={item.bookmarked}
          onPress={onToggleBookmark}
        />
        {onEdit ? <IconAction name="create-outline" label={v.edit} onPress={onEdit} /> : null}
        {onDelete ? (
          <IconAction
            name="trash-outline"
            label={v.delete}
            color={colors.destructive}
            onPress={onDelete}
          />
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingStart: spacing.lg + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadow.card,
  },
  edge: { position: 'absolute', start: 0, top: 0, bottom: 0, width: 5 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  level: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  source: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  word: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.foreground },
  example: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  practice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
