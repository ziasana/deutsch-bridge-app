import { View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { WritingAiFeedback, WritingFeedback } from '@/types/writing';
import { STATUS_META } from '../writingMeta';
import { Expandable } from './Expandable';

function Bullets({ items, glyph = '•' }: { items: string[]; glyph?: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {items.map((t) => (
        <AppText key={t}>
          {glyph} {t}
        </AppText>
      ))}
    </View>
  );
}

/** Feedback per dimension: what went well and what to improve, never one overall score. */
export function FeedbackView({ feedback }: { feedback: WritingFeedback }) {
  return (
    <View style={{ gap: spacing.md }}>
      {feedback.highlights.length > 0 ? (
        <Card style={{ backgroundColor: colors.successSoft, borderColor: colors.successSoft }}>
          <AppText variant="subheading">👍 Das hast du gut gemacht</AppText>
          <Bullets items={feedback.highlights} />
        </Card>
      ) : null}
      {feedback.nextFocus.length > 0 ? (
        <Card tone="accent">
          <AppText variant="subheading">🎯 Das solltest du als Nächstes verbessern</AppText>
          <Bullets items={feedback.nextFocus} />
        </Card>
      ) : null}
      <View style={{ gap: spacing.sm }}>
        {feedback.dimensions.map((d) => {
          const meta = STATUS_META[d.status];
          return (
            <Expandable
              key={d.key}
              defaultOpen={d.status === 'IMPROVE'}
              title={`${meta.glyph} ${d.title} · ${meta.label}`}
            >
              {d.positives.length > 0 ? <Bullets items={d.positives} glyph="✅" /> : null}
              {d.improvements.length > 0 ? (
                <Bullets items={d.improvements} glyph={d.status === 'NOT_ASSESSED' ? '🔍' : '💡'} />
              ) : null}
            </Expandable>
          );
        })}
      </View>
      <AppText variant="caption" color={colors.mutedForeground}>
        {feedback.source === 'RULES'
          ? 'Automatische Analyse nach festen Regeln – sie ersetzt keine Korrektur durch eine Lehrkraft.'
          : 'Feedback automatisch erstellt.'}
      </AppText>
    </View>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="subheading">{title}</AppText>
      <Bullets items={items} />
    </View>
  );
}

/** AI analysis of the learner's text; it only comments on the answer, never changes the task. */
export function AiFeedbackView({ feedback }: { feedback: WritingAiFeedback }) {
  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="subheading">🤖 KI-Feedback</AppText>
      <Block title="👍 Das ist gut gelungen" items={feedback.positives} />
      <Block title="❗ Fehlende oder schwache Punkte" items={feedback.missingPoints} />
      {feedback.grammar.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="subheading">✏️ Wichtigste Korrekturen</AppText>
          {feedback.grammar.map((g) => (
            <View key={g.original + g.corrected} style={{ gap: 2 }}>
              <AppText>
                <AppText color={colors.destructive} style={{ textDecorationLine: 'line-through' }}>
                  {g.original}
                </AppText>
                {' → '}
                <AppText color="#1B7A55" style={{ fontWeight: '700' }}>
                  {g.corrected}
                </AppText>
              </AppText>
              {g.explanation ? (
                <AppText variant="small" color={colors.mutedForeground}>
                  {g.explanation}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
      <Block title="📚 Wortschatz" items={feedback.vocabulary} />
      <Block title="🧱 Aufbau & Stil" items={feedback.structure} />
      {feedback.improvementExample ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="subheading">💡 Beispiel zur Verbesserung</AppText>
          <AppText>{feedback.improvementExample}</AppText>
        </View>
      ) : null}
      <AppText variant="caption" color={colors.mutedForeground}>
        Von einer KI erstellt – kann Fehler enthalten. Prüfe die Hinweise kritisch.
      </AppText>
    </Card>
  );
}
