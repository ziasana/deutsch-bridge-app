import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

/** Small accessible disclosure for progressive disclosure inside long feedback/help content. */
export function Expandable({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.box}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={styles.head}
      >
        <AppText variant="subheading" style={{ flex: 1 }}>
          {title}
        </AppText>
        <AppText color={colors.mutedForeground}>{open ? '▴' : '▾'}</AppText>
      </Pressable>
      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  head: { minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  body: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
