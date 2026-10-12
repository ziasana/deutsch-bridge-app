import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ApiError } from '@/api/errors';
import { AppText, Button, Card, ErrorState, Header, Screen, Skeleton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { PartResult, ResultResponse, ResultStatus, RubricCriterion, SimSection } from '@/types/examSimulation';
import { OVERALL_EXPLANATION, SIM_SECTION, formatDateTime, formatDuration, formatPoints } from './format';
import { useSimulationHistory, useSimulationResult } from './hooks';
import { ResultBadge } from './ResultBadge';
import { ScoreRing } from './ScoreRing';
import { ReviewExplorer } from './result/ReviewExplorer';

const HERO: Record<ResultStatus, { bg: string; title: string; emoji: string }> = {
  PASSED: { bg: '#1FA06E', title: 'Geschafft – schriftlich bestanden!', emoji: '🎉' },
  NOT_PASSED: { bg: '#E5594F', title: 'Noch nicht bestanden', emoji: '💪' },
  AWAITING_ASSESSMENT: { bg: '#D98E04', title: 'Vorläufiges Ergebnis', emoji: '⏳' },
  NOT_ASSESSED: { bg: '#64748B', title: 'Dein Ergebnis', emoji: '📝' },
  INCOMPLETE: { bg: '#D98E04', title: 'Vorläufiges Ergebnis', emoji: '⏳' },
};

/** Share of the points reached per exam section (only sections that are already scored). */
export function sectionShares(parts: PartResult[]): { section: SimSection; label: string; percent: number }[] {
  const by = new Map<SimSection, { score: number; max: number }>();
  for (const p of parts) {
    if (p.module !== 'WRITTEN' || p.status !== 'SCORED' || p.score == null || p.maxPoints <= 0) continue;
    const cur = by.get(p.section) ?? { score: 0, max: 0 };
    by.set(p.section, { score: cur.score + p.score, max: cur.max + p.maxPoints });
  }
  return [...by].map(([section, v]) => ({ section, label: SIM_SECTION[section].label, percent: Math.round((v.score / v.max) * 100) }));
}

function Meter({ value, max, passAt, color = colors.primary }: { value: number; max: number; passAt?: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }} style={styles.meter}>
      <View style={{ height: 10, width: `${pct}%`, backgroundColor: color, borderRadius: 5 }} />
      {passAt != null && max > 0 ? <View style={[styles.pass, { left: `${(passAt / max) * 100}%` }]} /> : null}
    </View>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={{ gap: spacing.sm }}>
      <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </AppText>
      {children}
    </Card>
  );
}

function BigScore({ score, max, status }: { score: number | null; max: number; status: ResultStatus }) {
  return (
    <View style={styles.bigRow}>
      <AppText style={styles.big}>
        {score != null ? formatPoints(score) : '–'}
        <AppText style={styles.bigMax}> / {formatPoints(max)}</AppText>
      </AppText>
      <ResultBadge status={status} />
    </View>
  );
}

/** One part: coloured by its section, with the points bar and, for questions, how many were right, wrong or left open. */
function PartCard({ part, rubric }: { part: PartResult; rubric: RubricCriterion[] }) {
  const st = SIM_SECTION[part.section];
  const pct = part.status === 'SCORED' && part.score != null && part.maxPoints > 0 ? (part.score / part.maxPoints) * 100 : 0;
  const total = part.totalQuestions || part.correct + part.incorrect + part.unanswered;
  return (
    <View style={styles.part}>
      <View style={styles.partHead}>
        <View style={[styles.partIcon, { backgroundColor: st.color }]}>
          <Ionicons name={st.icon} size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontWeight: '800' }} numberOfLines={2}>
            {part.label}
          </AppText>
          <AppText variant="caption" color={colors.mutedForeground}>
            {part.status === 'SCORED' ? `${Math.round(pct)} % erreicht` : part.status === 'AWAITING_ASSESSMENT' ? 'wird bewertet' : 'nicht bewertet'}
          </AppText>
        </View>
        {part.status === 'SCORED' ? (
          <AppText style={{ fontVariant: ['tabular-nums'] }}>
            <AppText style={{ fontSize: 20, fontWeight: '800' }}>{formatPoints(part.score)}</AppText> / {formatPoints(part.maxPoints)}
          </AppText>
        ) : part.status === 'AWAITING_ASSESSMENT' ? (
          <AppText variant="small" color="#9A6402">
            – / {formatPoints(part.maxPoints)}
          </AppText>
        ) : null}
      </View>
      {part.method === 'PER_QUESTION' && total > 0 ? (
        <>
          <View style={styles.split} accessibilityElementsHidden>
            <View style={{ flexGrow: part.correct, flexBasis: 0, backgroundColor: colors.success }} />
            <View style={{ flexGrow: part.incorrect, flexBasis: 0, backgroundColor: colors.destructive }} />
            <View style={{ flexGrow: part.unanswered, flexBasis: 0, backgroundColor: colors.border }} />
          </View>
          <AppText variant="caption" color={colors.mutedForeground}>
            {part.correct} richtig · {part.incorrect} falsch · {part.unanswered} offen
          </AppText>
        </>
      ) : null}
      {part.method === 'MANUAL_RUBRIC' && part.status === 'AWAITING_ASSESSMENT' ? (
        <AppText variant="caption" color="#9A6402" style={{ fontWeight: '700' }}>
          ⏳ Bewertung steht noch aus
        </AppText>
      ) : null}
      {part.method === 'MANUAL_RUBRIC' && part.status === 'SCORED' && part.criteriaScores ? (
        <View style={{ gap: spacing.sm }}>
          {rubric.map((c) => (
            <View key={c.key} style={{ gap: 2 }}>
              <AppText variant="caption" color={colors.mutedForeground}>
                {c.label}: {formatPoints(part.criteriaScores?.[c.key])} / {formatPoints(c.maxPoints)}
              </AppText>
              <Meter value={part.criteriaScores?.[c.key] ?? 0} max={c.maxPoints} color={st.color} />
            </View>
          ))}
          {part.assessorComment ? (
            <AppText variant="small" style={{ fontStyle: 'italic' }} color={colors.mutedForeground}>
              „{part.assessorComment}“
            </AppText>
          ) : null}
        </View>
      ) : null}
      {part.method === 'UNSCORED' ? (
        <View style={styles.practised}>
          <Ionicons name={part.completed ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={part.completed ? colors.success : colors.mutedForeground} />
          <AppText variant="caption" color={colors.mutedForeground}>
            {part.completed ? 'Geübt' : 'Nicht geübt'}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function ResultBody({ data, previousScore }: { data: ResultResponse; previousScore: number | null }) {
  const r = data.result;
  const writtenParts = r.parts.filter((p) => p.module === 'WRITTEN');
  const oralParts = r.parts.filter((p) => p.module === 'ORAL');
  const tone = HERO[r.writtenResult] ?? HERO.NOT_ASSESSED;
  const shares = sectionShares(r.parts);
  // Strongest / weakest area only say something when the areas actually differ.
  const top = shares.length > 1 ? shares.reduce((a, b) => (b.percent > a.percent ? b : a)) : null;
  const low = shares.length > 1 ? shares.reduce((a, b) => (b.percent < a.percent ? b : a)) : null;
  const spread = top && low ? top.percent > low.percent : false;
  const best = spread && top && top.percent > 0 ? top : null;
  const weakest = spread ? low : null;
  const delta = previousScore != null && r.writtenComplete ? r.writtenScore - previousScore : null;
  const missing = r.writtenScore < r.writtenPassThreshold && r.writtenComplete ? r.writtenPassThreshold - r.writtenScore : 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={[styles.hero, { backgroundColor: tone.bg }]}>
        <ScoreRing
          score={r.writtenScore}
          max={r.writtenMax}
          threshold={r.writtenPassThreshold}
          size={172}
          stroke={14}
          arc="#FFFFFF"
          track="rgba(255,255,255,0.25)"
          textColor="#FFFFFF"
          subColor="rgba(255,255,255,0.85)"
          label={`${formatPoints(r.writtenScore)} von ${formatPoints(r.writtenMax)} Punkten, Bestehensgrenze ${formatPoints(r.writtenPassThreshold)}`}
        />
        <AppText variant="caption" color="rgba(255,255,255,0.85)" style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Schriftliche Prüfung
        </AppText>
        <AppText style={styles.heroTitle} center accessibilityRole="header">
          {tone.emoji} {tone.title}
        </AppText>
        <AppText color="rgba(255,255,255,0.95)" center>
          {formatPoints(r.writtenPercentage)} % · Bestehensgrenze {formatPoints(r.writtenPassThreshold)} Punkte{missing > 0 ? ` · dir fehlen ${formatPoints(missing)} Punkte` : ''}
        </AppText>
        <View style={styles.chips}>
          {delta != null ? (
            <View style={styles.chip}>
              <Ionicons name={delta >= 0 ? 'trending-up' : 'trending-down'} size={14} color="#FFFFFF" />
              <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
                {delta >= 0 ? '+' : '−'}{formatPoints(Math.abs(delta))} zum letzten Versuch
              </AppText>
            </View>
          ) : null}
          {best ? (
            <View style={styles.chip}>
              <Ionicons name="trophy-outline" size={14} color="#FFFFFF" />
              <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>Stärkster Bereich: {best.label}</AppText>
            </View>
          ) : null}
          {weakest && weakest.section !== best?.section ? (
            <View style={styles.chip}>
              <Ionicons name="medal-outline" size={14} color="#FFFFFF" />
              <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>Üben: {weakest.label}</AppText>
            </View>
          ) : null}
        </View>
        {!r.writtenComplete ? (
          <AppText variant="caption" color="rgba(255,255,255,0.95)" center>
            Vorläufig: Es zählen nur die bisher bewerteten Teile.
          </AppText>
        ) : null}
      </View>

      <AppText variant="small" color={colors.mutedForeground}>
        {formatDateTime(data.startedAtMs)} · Dauer {formatDuration(data.durationSeconds)} · Profil-Version {data.profileVersion}
        {data.status === 'EXPIRED' ? ' · Zeit abgelaufen, gewertet wurden die gespeicherten Antworten' : ''}
      </AppText>

      <SummaryCard title="Schriftliche Prüfung">
        <BigScore score={r.writtenScore} max={r.writtenMax} status={r.writtenResult} />
        <Meter value={r.writtenScore} max={r.writtenMax} passAt={r.writtenPassThreshold} />
        <AppText variant="caption" color={colors.mutedForeground}>
          {formatPoints(r.writtenPercentage)} % · Bestehensgrenze {formatPoints(r.writtenPassThreshold)} Punkte
        </AppText>
      </SummaryCard>
      <SummaryCard title="Mündliche Prüfung">
        <BigScore score={r.oralScore} max={r.oralMax} status={r.oralResult} />
        <AppText variant="caption" color={colors.mutedForeground}>
          {r.oralScoringEnabled ? `Bestehensgrenze ${formatPoints(r.oralPassThreshold)} Punkte` : 'Mündliche Übung ohne Punktebewertung.'} · {oralParts.filter((p) => p.completed).length} von {oralParts.length} Teilen geübt
        </AppText>
      </SummaryCard>
      <SummaryCard title="Gesamtergebnis">
        <BigScore score={r.totalScore} max={r.totalMax} status={r.overallResult} />
        <View style={styles.explain}>
          <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
          <AppText variant="caption" style={{ flex: 1 }} color={colors.mutedForeground}>
            {OVERALL_EXPLANATION[r.overallExplanation] ?? ''}
          </AppText>
        </View>
      </SummaryCard>

      {r.pendingAssessmentParts.length > 0 ? (
        <View style={styles.pending} accessibilityRole="alert">
          <AppText variant="small" color="#7A5000">
            Noch nicht bewertet: {r.parts.filter((p) => r.pendingAssessmentParts.includes(p.key)).map((p) => p.label).join(', ')}. Das Ergebnis wird aktualisiert, sobald die Bewertung vorliegt – es wird keine Punktzahl geschätzt.
          </AppText>
        </View>
      ) : null}

      {shares.length >= 2 ? (
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: 2 }}>
            <AppText variant="heading" accessibilityRole="header">Deine Bereiche</AppText>
            <AppText variant="small" color={colors.mutedForeground}>Anteil der erreichten Punkte je Bereich.</AppText>
          </View>
          {shares.map((s) => (
            <View key={s.section} style={{ gap: 4 }} accessible accessibilityLabel={`${s.label}: ${s.percent} Prozent`}>
              <View style={styles.shareRow}>
                <AppText variant="small" style={{ flex: 1, fontWeight: '600' }}>{s.label}</AppText>
                <AppText variant="small" style={{ fontWeight: '800', fontVariant: ['tabular-nums'] }}>{s.percent} %</AppText>
              </View>
              <Meter value={s.percent} max={100} color={SIM_SECTION[s.section].color} />
            </View>
          ))}
        </Card>
      ) : null}

      {[{ title: 'Schriftliche Teile', parts: writtenParts }, { title: 'Mündliche Teile', parts: oralParts }].map(
        ({ title, parts }) =>
          parts.length > 0 ? (
            <Card key={title} style={{ gap: spacing.md }}>
              <AppText variant="heading" accessibilityRole="header">{title}</AppText>
              {parts.map((p) => (
                <PartCard key={p.key} part={p} rubric={data.rubrics[p.key] ?? []} />
              ))}
            </Card>
          ) : null,
      )}

      <ReviewExplorer data={data} />
    </View>
  );
}

/** The result of a finished exam. Written, oral and overall results are shown separately; nothing missing is hidden or guessed. */
export function ResultScreen() {
  const router = useRouter();
  const { attempt = '' } = useLocalSearchParams<{ attempt?: string }>();
  const query = useSimulationResult(attempt);
  const history = useSimulationHistory();
  const data = query.data;
  // Still running: the result does not exist yet, continue the exam instead.
  const running = query.error instanceof ApiError && query.error.code === 'ATTEMPT_IN_PROGRESS';
  useEffect(() => {
    if (running && attempt) router.replace({ pathname: '/exam-prep/pruefung/durchfuehrung', params: { attempt } });
  }, [running, attempt, router]);

  // The attempt before this one, for the "better / worse than last time" chip.
  const previous = data
    ? [...(history.data?.progress ?? [])]
        .filter((p) => p.attemptId !== data.attemptId && p.writtenComplete && p.writtenScore != null && p.endedAtMs < (data.endedAtMs ?? Number.MAX_SAFE_INTEGER))
        .sort((a, b) => b.endedAtMs - a.endedAtMs)[0]
    : undefined;

  const toOverview = () => router.replace('/exam-prep/pruefung');

  let body;
  if (!attempt) body = <AppText center>Keine Prüfung ausgewählt.</AppText>;
  else if (query.isPending || running) {
    body = (
      <View accessibilityLabel="Ergebnis wird geladen" style={{ gap: spacing.md }}>
        <Skeleton height={300} />
        <Skeleton height={120} />
      </View>
    );
  } else if (query.isError || !data) body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  else {
    body = (
      <View style={{ gap: spacing.xl }}>
        <ResultBody data={data} previousScore={previous?.writtenScore ?? null} />
        <View style={{ gap: spacing.sm }}>
          <Button pill label="Zur Übersicht" onPress={toOverview} />
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <Header back title="Ergebnis" subtitle={data?.profileTitle} />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl, borderRadius: radius.lg },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.25)' },
  meter: { height: 10, borderRadius: 5, backgroundColor: colors.secondary, overflow: 'hidden' },
  pass: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.ink },
  bigRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  big: { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.ink, fontVariant: ['tabular-nums'] },
  bigMax: { fontSize: 16, fontWeight: '600', color: colors.mutedForeground },
  explain: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  pending: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningSoft },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  part: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  partHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  partIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  split: { flexDirection: 'row', height: 10, gap: 2, borderRadius: 5, overflow: 'hidden' },
  practised: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
