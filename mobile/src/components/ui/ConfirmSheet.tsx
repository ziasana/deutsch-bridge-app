import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { useI18n } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button for actions that end something (sign out, delete). */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Confirmation as a bottom sheet: handle, centred question, a big pill action and a plain cancel. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const { t, dir } = useI18n();
  cancelLabel ??= t.common.cancel;
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={[styles.root, { direction: dir }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          style={styles.backdrop}
          onPress={onCancel}
        />
        <SafeAreaView edges={['bottom']} style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <AppText style={styles.title} accessibilityRole="header">
            {title}
          </AppText>
          <AppText center color={colors.ink} style={styles.message}>
            {message}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.confirm(confirmLabel)}
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.confirm,
              { backgroundColor: destructive ? '#EC3E4E' : colors.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <AppText style={styles.confirmText}>{confirmLabel}</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            onPress={onCancel}
            style={styles.cancel}
          >
            <AppText style={styles.cancelText}>{cancelLabel}</AppText>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(29,36,51,0.45)',
  },
  sheet: {
    alignItems: 'stretch',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', textAlign: 'center', color: '#000000' },
  message: {
    fontSize: 17,
    lineHeight: 24,
    marginTop: spacing.md,
    marginBottom: spacing.xl + spacing.md,
  },
  confirm: {
    minHeight: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  cancel: { minHeight: 60, alignItems: 'center', justifyContent: 'center', marginTop: spacing.xs },
  cancelText: { fontSize: 20, fontWeight: '600', color: colors.foreground },
});
