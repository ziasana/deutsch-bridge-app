import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, BottomSheet, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { AnswerMap, AttemptState, PartState } from '@/types/examSimulation';
import { isAnswered, partItems } from './partItems';

function Option({
  icon,
  title,
  text,
  tone = colors.primary,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  tone?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={text}
      disabled={disabled}
      onPress={onPress}
      style={[styles.option, disabled && { opacity: 0.5 }]}
    >
      <View style={[styles.optionIcon, { backgroundColor: `${tone}1F` }]}>
        <Ionicons name={icon} size={22} color={tone} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ fontWeight: '800' }}>{title}</AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {text}
        </AppText>
      </View>
    </Pressable>
  );
}

/** What "…" means: take a break (the clock stops, continue later) or end the exam now and see the result. */
export function ExitSheet({ visible, busy, onPause, onFinish, onClose }: { visible: boolean; busy: boolean; onPause: () => void; onFinish: () => void; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Prüfung verlassen">
      <AppText color={colors.mutedForeground}>Was möchtest du tun?</AppText>
      <Option
        icon="pause"
        title="Pause machen"
        text="Die Zeit wird angehalten und deine Antworten sind gespeichert. Du machst später genau dort weiter, wo du aufgehört hast."
        disabled={busy}
        onPress={onPause}
      />
      <Option
        icon="paper-plane-outline"
        tone={colors.destructive}
        title="Prüfung beenden"
        text="Die Prüfung wird abgegeben und ausgewertet. Danach kannst du nichts mehr ändern. Offene Fragen zählen 0 Punkte."
        disabled={busy}
        onPress={onFinish}
      />
      <Button pill variant="secondary" label="Zurück zur Prüfung" onPress={onClose} />
    </BottomSheet>
  );
}

/** The two ways on at the end of a section: start the next one (no way back) or hand in. */
export function FinishSheet({
  visible,
  isLastStage,
  nextLabel,
  busy,
  onEndSection,
  onSubmit,
  onClose,
}: {
  visible: boolean;
  isLastStage: boolean;
  nextLabel: string | null;
  busy: boolean;
  onEndSection: () => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Abschließen">
      {!isLastStage ? (
        <Option
          icon="arrow-forward-circle-outline"
          title="Abschnitt beenden"
          text={`Du kannst danach nicht mehr zu diesem Abschnitt zurückkehren. Die Zeit${nextLabel ? ` für „${nextLabel}“` : ' des nächsten Abschnitts'} beginnt sofort.`}
          disabled={busy}
          onPress={onEndSection}
        />
      ) : null}
      <Option
        icon="paper-plane-outline"
        tone={colors.destructive}
        title="Prüfung abgeben"
        text="Du siehst vorher eine Übersicht. Nach der Abgabe kannst du nichts mehr ändern."
        disabled={busy}
        onPress={onSubmit}
      />
      <Button pill variant="secondary" label="Zurück zur Prüfung" onPress={onClose} />
    </BottomSheet>
  );
}

/** Final review before submission: what is answered, open or flagged, and what the submission means for the remaining sections. */
export function ReviewSheet({ state, submitting, onConfirm, onClose }: { state: AttemptState | null; submitting: boolean; onConfirm: () => void; onClose: () => void }) {
  const remaining = state?.stages.filter((s) => s.status === 'PENDING' && s.kind === 'WORKING') ?? [];
  const open = state?.progress.reduce((sum, p) => sum + (p.total - p.answered), 0) ?? 0;
  return (
    <BottomSheet visible={!!state} onClose={onClose} title="Prüfung abgeben?" tall>
      <AppText color={colors.mutedForeground}>Nach der Abgabe kannst du nichts mehr ändern. Unbeantwortete Fragen werden mit 0 Punkten gewertet.</AppText>
      {open > 0 ? (
        <View style={[styles.note, { backgroundColor: colors.warningSoft }]}>
          <AppText variant="small" color="#7A5000">
            Noch {open} offene {open === 1 ? 'Antwort' : 'Antworten'}.
          </AppText>
        </View>
      ) : null}
      {remaining.length > 0 ? (
        <View style={[styles.note, { backgroundColor: colors.destructiveSoft }]}>
          <AppText variant="small" color="#9B2222">
            Du hast noch nicht begonnene Abschnitte: {remaining.map((s) => s.label).join(', ')}. Sie werden mit der Abgabe nicht mehr bearbeitet.
          </AppText>
        </View>
      ) : null}
      <Button pill label="Jetzt abgeben" loading={submitting} onPress={onConfirm} />
      <Button pill variant="secondary" label="Zurück zur Prüfung" disabled={submitting} onPress={onClose} />
      <AppText variant="subheading">Übersicht</AppText>
      <View style={{ gap: spacing.md }}>
        {state?.progress.map((p) => {
          const complete = p.total > 0 && p.answered === p.total;
          return (
            <View key={p.partKey} style={{ gap: 4 }}>
              <View style={styles.reviewRow}>
                <AppText style={{ flex: 1, fontWeight: '600' }}>{p.label}</AppText>
                {p.flagged > 0 ? (
                  <View style={styles.flags}>
                    <Ionicons name="flag" size={13} color={colors.warning} />
                    <AppText variant="caption" color="#9A6402" style={{ fontWeight: '700' }}>
                      {p.flagged}
                    </AppText>
                  </View>
                ) : null}
                <AppText variant="small" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }} color={complete ? '#1B7A55' : '#9A6402'}>
                  {p.answered} / {p.total}
                </AppText>
              </View>
              <View style={styles.bar}>
                <View style={{ height: 8, borderRadius: 4, width: `${p.total ? (p.answered / p.total) * 100 : 0}%`, backgroundColor: complete ? colors.success : colors.warning }} />
              </View>
            </View>
          );
        })}
      </View>
    </BottomSheet>
  );
}

/** Question palette: every question of the section with answered / open / flagged state; a tap opens its part and scrolls to it. */
export function PaletteSheet({
  visible,
  parts,
  answers,
  color,
  activeKey,
  onPick,
  onClose,
}: {
  visible: boolean;
  parts: PartState[];
  answers: AnswerMap;
  color: string;
  activeKey: string;
  onPick: (partKey: string, itemId: string) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Übersicht" tall>
      {parts.map((part) => {
        const items = partItems(part);
        const done = items.filter((i) => isAnswered(answers, part.key, i.id)).length;
        return (
          <View key={part.key} style={[styles.group, part.key === activeKey && { backgroundColor: `${color}14` }]}>
            <View style={styles.reviewRow}>
              <AppText style={{ flex: 1, fontWeight: '800' }}>{part.label}</AppText>
              <AppText variant="small" color={colors.mutedForeground} style={{ fontVariant: ['tabular-nums'] }}>
                {done}/{items.length}
              </AppText>
            </View>
            <View style={styles.grid}>
              {items.map((item) => {
                const saved = answers[part.key]?.[item.id];
                const answered = isAnswered(answers, part.key, item.id);
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${part.label}, ${item.label}: ${answered ? 'beantwortet' : 'unbeantwortet'}${saved?.flagged ? ', markiert' : ''}`}
                    onPress={() => onPick(part.key, item.id)}
                    style={[styles.cell, answered ? { backgroundColor: color, borderColor: color } : { borderStyle: 'dashed', borderColor: `${color}80` }]}
                  >
                    <AppText variant="small" style={{ fontWeight: '800' }} color={answered ? '#FFFFFF' : colors.ink}>
                      {item.label}
                    </AppText>
                    {saved?.flagged ? (
                      <View style={styles.flagDot}>
                        <Ionicons name="flag" size={10} color={colors.warning} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: color }]} />
          <AppText variant="caption" color={colors.mutedForeground}>beantwortet</AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.swatch, { borderWidth: 1, borderStyle: 'dashed', borderColor: color }]} />
          <AppText variant="caption" color={colors.mutedForeground}>offen</AppText>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="flag" size={12} color={colors.warning} />
          <AppText variant="caption" color={colors.mutedForeground}>markiert</AppText>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flags: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.secondary, overflow: 'hidden' },
  note: { padding: spacing.md, borderRadius: radius.md },
  group: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    minWidth: 44,
    height: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm + 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagDot: { position: 'absolute', top: -5, right: -5 },
  legend: { flexDirection: 'row', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
});
