import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText } from '@/components/ui';
import { TextSizeControl, tint } from '@/features/exam/components/kit';
import { RichContentScale } from '@/features/exam/components/RichContentScale';
import { scaledText, useExamTextScale } from '@/features/exam/textScale';
import { colors, radius, shadow, spacing } from '@/theme';
import type { Redemittel } from '@/types/redemittel';
import {
  CONTEXT_LABELS,
  FORMALITY_LABELS,
  REDEMITTEL_COLOR,
  STATUS_LABELS,
  categoryEmoji,
} from '../meta';

/** Body text that follows the learner's text size (the same setting as the exam, lessons and expressions). */
function Body({
  size = 16,
  line = 24,
  style,
  color,
  children,
}: {
  size?: number;
  line?: number;
  style?: object;
  color?: string;
  children: ReactNode;
}) {
  const scale = useExamTextScale();
  return (
    <AppText color={color} style={[scaledText(size, line, scale), style]}>
      {children}
    </AppText>
  );
}

function Block({ title, children, style }: { title: string; children: ReactNode; style?: object }) {
  return (
    <View style={[styles.block, style]}>
      <AppText variant="caption" color={REDEMITTEL_COLOR} style={{ fontWeight: '800' }}>
        {title.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

/** A section hidden until asked for: a quiet row with a chevron. */
function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.collapsible}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Ausblenden' : 'Anzeigen'} – ${title}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.collapseHead}
      >
        <AppText variant="caption" color={REDEMITTEL_COLOR} style={{ fontWeight: '800', flex: 1 }}>
          {title.toUpperCase()}
        </AppText>
        <AppText variant="small" color={colors.primaryDark} style={{ fontWeight: '700' }}>
          {open ? 'Ausblenden' : 'Anzeigen'}
        </AppText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.primaryDark}
        />
      </Pressable>
      {open ? <View style={styles.collapseBody}>{children}</View> : null}
    </View>
  );
}

/**
 * The learning card for one Redemittel: only the sections an admin filled in are shown. Used by the
 * detail screen and the daily learn flow.
 */
export function DetailCard({
  redemittel: r,
  onToggleSave,
  saving,
  children,
}: {
  redemittel: Redemittel;
  onToggleSave?: (r: Redemittel) => void;
  saving?: boolean;
  /** Main action(s) at the bottom, e.g. "Verstanden – weiter". */
  children?: ReactNode;
}) {
  // The German explanation only appears when it adds something beyond the meaning.
  const explanation = r.explanation && r.explanation !== r.meaning ? r.explanation : null;
  return (
    <RichContentScale>
      <View style={styles.card}>
        <View style={styles.sizeRow}>
          <AppText variant="small" color={colors.mutedForeground} style={{ fontWeight: '600' }}>
            Schriftgröße
          </AppText>
          <TextSizeControl />
        </View>
        <View style={styles.head}>
          <View style={styles.emoji}>
            <AppText style={{ fontSize: 28, lineHeight: 34 }}>{categoryEmoji(r.category)}</AppText>
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <View style={styles.chips}>
              <Chip text={r.level} strong />
              <Chip text={r.categoryLabel} />
              {r.formality ? <Chip text={FORMALITY_LABELS[r.formality]} /> : null}
              <Chip text={STATUS_LABELS[r.status]} tinted />
            </View>
            <AppText style={styles.phrase} accessibilityRole="header">
              {r.phrase}
            </AppText>
          </View>
        </View>

        {r.meaning ? (
          <Block title="Bedeutung" style={{ backgroundColor: tint(REDEMITTEL_COLOR, '14') }}>
            <Body size={18} line={26} style={styles.meaning}>
              {r.meaning}
            </Body>
          </Block>
        ) : null}
        {explanation ? (
          <Block title="Erklärung">
            <RichContent content={explanation} />
          </Block>
        ) : null}
        {r.example ? (
          <Block title="Beispiel" style={styles.example}>
            <Body style={{ fontStyle: 'italic', fontWeight: '600' }} color={colors.ink}>
              „{r.example}“
            </Body>
          </Block>
        ) : null}
        {r.usageNote ? (
          <Block title="Hinweis" style={{ backgroundColor: colors.warningSoft }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Ionicons name="bulb" size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <RichContent content={r.usageNote} />
              </View>
            </View>
          </Block>
        ) : null}
        {r.grammarPattern ? (
          <Block title="Grammatik / Struktur">
            <View style={styles.pattern}>
              <Body style={{ fontWeight: '700' }}>{r.grammarPattern}</Body>
            </View>
          </Block>
        ) : null}
        {r.contexts.length > 0 ? (
          <Block title="Verwendung">
            <View style={styles.chips}>
              {r.contexts.map((c) => (
                <Chip key={c} text={CONTEXT_LABELS[c]} />
              ))}
            </View>
          </Block>
        ) : null}
        {r.similarExpressions.length > 0 ? (
          <Collapsible title="Ähnliche Redemittel">
            <View style={{ gap: spacing.xs }}>
              {r.similarExpressions.map((s) => (
                <Body key={s}>• {s}</Body>
              ))}
            </View>
          </Collapsible>
        ) : null}
        {r.commonMistake ? (
          <Collapsible title="Häufiger Fehler">
            <View style={styles.mistake}>
              <Body>⚠️ {r.commonMistake}</Body>
            </View>
          </Collapsible>
        ) : null}

        {children || onToggleSave ? (
          <View style={styles.footer}>
            {children}
            {onToggleSave ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={r.saved ? 'In meiner Sammlung' : 'Zu meinen Redemitteln'}
                accessibilityState={{ selected: r.saved, busy: saving }}
                disabled={saving}
                onPress={() => onToggleSave(r)}
                style={[
                  styles.save,
                  r.saved && { backgroundColor: colors.warningSoft, borderColor: colors.warning },
                ]}
              >
                <Ionicons
                  name={r.saved ? 'star' : 'star-outline'}
                  size={18}
                  color={r.saved ? colors.warning : colors.mutedForeground}
                />
                <AppText variant="small" style={{ fontWeight: '700' }} color={colors.ink}>
                  {r.saved ? 'In meiner Sammlung' : 'Zu meinen Redemitteln'}
                </AppText>
              </Pressable>
            ) : null}
            {onToggleSave ? (
              <AppText variant="caption" color={colors.mutedForeground} center>
                {r.saved
                  ? 'Gespeichert: Du kannst dieses Redemittel jetzt üben.'
                  : 'Speichere es, um es zu üben – auch bevor du es gelernt hast.'}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>
    </RichContentScale>
  );
}

function Chip({ text, strong, tinted }: { text: string; strong?: boolean; tinted?: boolean }) {
  return (
    <View
      style={[
        styles.chip,
        strong && { backgroundColor: colors.accent },
        tinted && { backgroundColor: tint(REDEMITTEL_COLOR, '33') },
      ]}
    >
      <AppText
        variant="caption"
        style={{ fontWeight: '800' }}
        color={strong ? colors.primaryDark : tinted ? '#B0295A' : colors.mutedForeground}
      >
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  head: { flexDirection: 'row', gap: spacing.md },
  emoji: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tint(REDEMITTEL_COLOR, '1F'),
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
  },
  phrase: { fontSize: 26, lineHeight: 33, fontWeight: '800', color: colors.ink },
  block: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg },
  meaning: { fontWeight: '700', color: colors.foreground },
  sizeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  example: { backgroundColor: colors.accent, borderTopLeftRadius: 6 },
  pattern: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: tint(colors.primary, '1F'),
  },
  collapsible: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  collapseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    minHeight: 48,
  },
  collapseBody: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  mistake: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningSoft },
  footer: {
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
