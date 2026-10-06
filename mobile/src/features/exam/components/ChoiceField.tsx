import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

export type Choice = { value: string; label: string; disabled?: boolean };

type Props = {
  label: string;
  value: string;
  choices: Choice[];
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accent for the filled state (section colour). */
  color?: string;
};

/** A dropdown for long answer lists: tap, pick from a bottom sheet. */
export function ChoiceField({
  label,
  value,
  choices,
  disabled,
  onChange,
  placeholder = 'Antwort wählen …',
  color = colors.primary,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = choices.find((c) => c.value === value);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? 'Keine Antwort gewählt' }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          selected && { borderColor: color, backgroundColor: `${color}14` },
          disabled && { opacity: 0.6 },
        ]}
      >
        <AppText
          style={{ flex: 1, fontWeight: selected ? '600' : '400' }}
          color={selected ? colors.foreground : colors.mutedForeground}
        >
          {selected?.label ?? placeholder}
        </AppText>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'chevron-down'}
          size={22}
          color={selected ? color : colors.mutedForeground}
        />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ gap: spacing.sm }}>
          {choices.map((c) => (
            <Pressable
              key={c.value}
              accessibilityRole="radio"
              accessibilityLabel={c.label}
              accessibilityState={{ selected: c.value === value, disabled: c.disabled }}
              disabled={c.disabled}
              onPress={() => {
                onChange(c.value);
                setOpen(false);
              }}
              style={[styles.choice, c.value === value && styles.picked, c.disabled && { opacity: 0.4 }]}
            >
              <AppText>{c.label}</AppText>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: MIN_TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choice: {
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  picked: { borderColor: colors.primary, backgroundColor: colors.accent },
});
