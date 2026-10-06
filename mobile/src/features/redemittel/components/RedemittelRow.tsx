import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { PressableScale, tint } from '@/features/exam/components/kit';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Redemittel } from '@/types/redemittel';
import { STATUS_COLOR, categoryEmoji } from '../meta';
import { StatusStepper } from './RedemittelViz';

type Props = {
  item: Redemittel;
  onOpen: () => void;
  onToggleSave: () => void;
};

/** One Redemittel as a card: category emoji, phrase, meaning, status stepper, level and a star. */
export function RedemittelRow({ item, onOpen, onToggleSave }: Props) {
  const color = STATUS_COLOR[item.status];
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${item.phrase}${item.meaning ? `, ${item.meaning}` : ''}`}
      onPress={onOpen}
      style={styles.card}
    >
      <View style={[styles.edge, { backgroundColor: color }]} />
      <View style={[styles.emoji, { backgroundColor: tint(color, '1F') }]}>
        <AppText style={{ fontSize: 24, lineHeight: 30 }}>{categoryEmoji(item.category)}</AppText>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <AppText variant="subheading">{item.phrase}</AppText>
        <AppText variant="small" color={colors.mutedForeground} numberOfLines={2}>
          {item.meaning ?? item.categoryLabel}
        </AppText>
        <View style={styles.meta}>
          <View style={styles.level}>
            <AppText variant="caption" color={colors.primaryDark} style={{ fontWeight: '800' }}>
              {item.level}
            </AppText>
          </View>
          <StatusStepper status={item.status} />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          item.saved ? 'Aus meiner Sammlung entfernen' : 'Zu meinen Redemitteln hinzufügen'
        }
        accessibilityState={{ selected: item.saved }}
        onPress={onToggleSave}
        hitSlop={spacing.sm}
        style={styles.star}
      >
        <Ionicons
          name={item.saved ? 'star' : 'star-outline'}
          size={22}
          color={item.saved ? colors.warning : colors.mutedForeground}
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
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  emoji: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  level: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  star: { padding: spacing.xs },
});
