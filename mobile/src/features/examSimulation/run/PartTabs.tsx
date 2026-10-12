import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { AnswerMap, PartState } from '@/types/examSimulation';
import { countAnswered, partItems } from './partItems';

type Props = { parts: PartState[]; answers: AnswerMap; activeKey: string; color: string; onSelect: (key: string) => void };

/** Teile of the running section as tabs with their answered count. */
export function PartTabs({ parts, answers, activeKey, color, onSelect }: Props) {
  const scroller = useRef<ScrollView>(null);
  const offsets = useRef(new Map<string, number>());
  // Keep the active tab in view when the part changes from elsewhere (next button, overview).
  useEffect(() => {
    const x = offsets.current.get(activeKey);
    if (x != null) scroller.current?.scrollTo({ x: Math.max(0, x - spacing.lg), animated: true });
  }, [activeKey]);
  return (
    <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroll} accessibilityRole="tablist">
      {parts.map((p) => {
        const total = partItems(p).length;
        const done = countAnswered(p, answers);
        const active = p.key === activeKey;
        const complete = total > 0 && done === total;
        return (
          <Pressable
            key={p.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${p.label}, ${done} von ${total} beantwortet`}
            onPress={() => onSelect(p.key)}
            onLayout={(e) => offsets.current.set(p.key, e.nativeEvent.layout.x)}
            style={[styles.tab, active && { backgroundColor: color, borderColor: color }]}
          >
            {complete ? <Ionicons name="checkmark" size={16} color={active ? '#FFFFFF' : color} /> : null}
            <AppText variant="small" style={{ fontWeight: '700' }} color={active ? '#FFFFFF' : colors.ink}>
              {p.label}
            </AppText>
            <AppText variant="caption" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }} color={active ? '#FFFFFF' : colors.mutedForeground}>
              {done}/{total}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  tab: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
