import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppText, Card, Chip } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { WritingAttempt } from '@/types/writing';
import { diffWords } from '../wordDiff';
import { WRITING_COLOR } from '@/features/exam/writing/learn/ui';
import { darken } from '@/features/exam/components/kit';

function Delta({ label, before, after }: { label: string; before: number; after: number }) {
  const diff = after - before;
  return (
    <View style={{ minWidth: '45%', flex: 1 }}>
      <AppText variant="caption" color={colors.mutedForeground}>
        {label}
      </AppText>
      <AppText style={{ fontWeight: '700' }}>
        {before} → {after}
        {diff !== 0 ? (
          <AppText variant="small" color={diff > 0 ? '#1B7A55' : colors.warning}>
            {' '}
            ({diff > 0 ? '+' : ''}
            {diff})
          </AppText>
        ) : null}
      </AppText>
    </View>
  );
}

const open = (a: WritingAttempt) =>
  a.feedback
    ? a.feedback.dimensions.reduce((n, d) => n + (d.status === 'NOT_ASSESSED' ? 0 : d.improvements.length), 0)
    : 0;

/** Original vs. revision with the changed words highlighted in both. */
export function CompareView({ attempts }: { attempts: WritingAttempt[] }) {
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(attempts.length - 1);
  const from = attempts[Math.min(fromIdx, attempts.length - 1)];
  const to = attempts[Math.min(toIdx, attempts.length - 1)];
  const parts = useMemo(() => diffWords(from.text, to.text), [from.text, to.text]);

  const picker = (label: string, value: number, set: (i: number) => void) => (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="small" color={colors.mutedForeground}>
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {attempts.map((a, i) => (
          <Chip
            key={a.id}
            label={`${label}: Versuch ${a.attemptNumber}`}
            selected={value === i}
            onPress={() => set(i)}
            color={darken(WRITING_COLOR)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ gap: spacing.md }}>
      {picker('Original', fromIdx, setFromIdx)}
      {picker('Überarbeitung', toIdx, setToIdx)}

      <Card>
        <AppText variant="caption" color={colors.mutedForeground}>
          ORIGINAL
        </AppText>
        <AppText>
          {parts
            .filter((p) => p.kind !== 'added')
            .map((p, i) => (
              <AppText
                key={i}
                style={p.kind === 'removed' ? { backgroundColor: colors.destructiveSoft } : undefined}
              >
                {p.text}
              </AppText>
            ))}
        </AppText>
      </Card>
      <Card>
        <AppText variant="caption" color={colors.mutedForeground}>
          ÜBERARBEITUNG
        </AppText>
        <AppText>
          {parts
            .filter((p) => p.kind !== 'removed')
            .map((p, i) => (
              <AppText
                key={i}
                style={p.kind === 'added' ? { backgroundColor: colors.successSoft } : undefined}
              >
                {p.text}
              </AppText>
            ))}
        </AppText>
      </Card>

      {from.feedback && to.feedback ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <Delta label="Wörter" before={from.feedback.stats.wordCount} after={to.feedback.stats.wordCount} />
          <Delta label="Verbindungswörter" before={from.feedback.stats.connectorCount} after={to.feedback.stats.connectorCount} />
          <Delta label="Redemittel" before={from.feedback.stats.usedPhrases.length} after={to.feedback.stats.usedPhrases.length} />
          <Delta label="Offene Hinweise" before={open(from)} after={open(to)} />
        </View>
      ) : null}
    </View>
  );
}
