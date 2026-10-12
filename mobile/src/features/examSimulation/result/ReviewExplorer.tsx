import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { ResultResponse, ReviewQuestion } from '@/types/examSimulation';

function Fold({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fold}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((v) => !v)} style={styles.foldHead}>
        <AppText variant="small" style={{ flex: 1, fontWeight: '700' }}>
          {title}
        </AppText>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
      </Pressable>
      {open ? <View style={{ paddingTop: spacing.sm }}>{children}</View> : null}
    </View>
  );
}

/**
 * The detailed feedback as an explorer: pick a part, see all its questions as green / red tiles, tap a tile for the
 * learner's answer, the right answer and the explanation. "Nur Fehler" narrows the tiles to what went wrong.
 */
export function ReviewExplorer({ data }: { data: ResultResponse }) {
  const labels = new Map(data.result.parts.map((p) => [p.key, p.label]));
  const parts = data.review.filter((part) => part.exercises.some((e) => e.questions.length > 0 || e.writtenAnswer));
  const [partKey, setPartKey] = useState(parts[0]?.partKey ?? '');
  const [onlyWrong, setOnlyWrong] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  if (!data.answersReleased) {
    return (
      <Card tone="accent">
        <AppText variant="small">
          {data.answerReleasePolicy === 'SCORE_ONLY'
            ? 'Für dieses Prüfungsprofil werden Lösungen nicht angezeigt.'
            : 'Die richtigen Antworten werden freigegeben, sobald alle Bewertungen vorliegen.'}
        </AppText>
      </Card>
    );
  }
  const part = parts.find((p) => p.partKey === partKey) ?? parts[0];
  if (!part) return null;

  const questions: ReviewQuestion[] = part.exercises.flatMap((e) => e.questions);
  const visible = onlyWrong ? questions.filter((q) => !q.correct) : questions;
  const numberOf = (q: ReviewQuestion) => q.questionNumber ?? questions.indexOf(q) + 1;
  // Open on the first mistake - that is what is worth reading first.
  const selected = visible.find((q) => q.id === picked) ?? visible.find((q) => !q.correct) ?? visible[0];
  const wrongIn = (key: string) => data.review.find((p) => p.partKey === key)?.exercises.flatMap((e) => e.questions).filter((q) => !q.correct).length ?? 0;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={styles.titleRow}>
        <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
          Detailliertes Feedback
        </AppText>
        {questions.length > 0 ? (
          <View style={styles.toggle}>
            <AppText variant="small" style={{ fontWeight: '600' }}>Nur Fehler</AppText>
            <Switch accessibilityLabel="Nur Fehler" value={onlyWrong} onValueChange={setOnlyWrong} trackColor={{ true: colors.primary }} />
          </View>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }} accessibilityRole="tablist">
        {parts.map((p) => {
          const wrong = wrongIn(p.partKey);
          const active = p.partKey === part.partKey;
          return (
            <Pressable
              key={p.partKey}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setPartKey(p.partKey);
                setPicked(null);
              }}
              style={[styles.tab, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <AppText variant="small" style={{ fontWeight: '700' }} color={active ? '#FFFFFF' : colors.ink}>
                {labels.get(p.partKey)}
              </AppText>
              {wrong > 0 ? (
                <AppText variant="caption" style={{ fontWeight: '800' }} color={active ? '#FFFFFF' : colors.destructive}>
                  {wrong} ✕
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <Card style={{ gap: spacing.md }}>
        {questions.length > 0 ? (
          <View style={styles.tiles} accessibilityLabel="Fragen">
            {visible.map((q) => (
              <Pressable
                key={q.id}
                accessibilityRole="button"
                accessibilityLabel={`Frage ${numberOf(q)}: ${q.correct ? 'richtig' : 'falsch'}`}
                accessibilityState={{ selected: selected?.id === q.id }}
                onPress={() => setPicked(q.id)}
                style={[styles.tile, { backgroundColor: q.correct ? colors.success : colors.destructive }, selected?.id === q.id && styles.tileOn]}
              >
                <AppText style={{ fontWeight: '800' }} color="#FFFFFF">
                  {numberOf(q)}
                </AppText>
              </Pressable>
            ))}
            {visible.length === 0 ? <AppText variant="small" color={colors.mutedForeground}>Keine Fehler in diesem Teil.</AppText> : null}
          </View>
        ) : null}

        {selected ? (
          <View style={styles.detail}>
            <View style={styles.titleRow}>
              <View style={[styles.mark, { backgroundColor: selected.correct ? colors.success : colors.destructive }]}>
                <Ionicons name={selected.correct ? 'checkmark' : 'close'} size={14} color="#FFFFFF" />
              </View>
              <AppText style={{ flex: 1, fontWeight: '700' }}>
                {numberOf(selected)}. {selected.prompt}
              </AppText>
            </View>
            <AppText variant="small" color={colors.mutedForeground}>
              Deine Antwort: <AppText variant="small" style={{ fontWeight: '700' }}>{selected.givenAnswer?.trim() ? selected.givenAnswer : 'keine Antwort'}</AppText>
            </AppText>
            {!selected.correct ? (
              <AppText variant="small" color={colors.mutedForeground}>
                Richtig: <AppText variant="small" style={{ fontWeight: '700' }} color="#1B7A55">{selected.correctAnswer}</AppText>
              </AppText>
            ) : null}
            {selected.explanation ? <RichContent content={selected.explanation} /> : null}
            {selected.commonMistake ? (
              <View style={styles.mistake}>
                <Ionicons name="bulb-outline" size={16} color={colors.warning} />
                <AppText variant="small" style={{ flex: 1 }} color="#7A5000">
                  Häufiger Fehler: {selected.commonMistake}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}

        {part.exercises.map((e) => (
          <View key={e.ordinal} style={{ gap: spacing.sm }}>
            {e.transcriptHtml ? (
              <Fold title="Transkript">
                <RichContent content={e.transcriptHtml} />
              </Fold>
            ) : null}
            {e.writtenAnswer ? (
              <View style={styles.written}>
                <AppText variant="small" style={{ fontWeight: '800' }}>Dein Text</AppText>
                <AppText variant="small">{e.writtenAnswer}</AppText>
              </View>
            ) : null}
            {e.modelSolution ? (
              <Fold title="Mögliche Antwort">
                <RichContent content={e.modelSolution} />
              </Fold>
            ) : null}
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tab: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: 44, height: 44, borderRadius: radius.sm + 4, alignItems: 'center', justifyContent: 'center' },
  tileOn: { borderWidth: 3, borderColor: colors.ink },
  detail: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent },
  mark: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  mistake: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  fold: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent },
  foldHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 28 },
  written: { gap: 4, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
});
