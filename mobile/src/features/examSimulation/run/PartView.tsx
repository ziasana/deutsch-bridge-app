import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import { AppText, Card } from '@/components/ui';
import { PassageBody, ReadingCard, WordBank } from '@/features/exam/components/Passages';
import { tint } from '@/features/exam/components/kit';
import { withGapMarkers } from '@/features/exam/content';
import { BODY_LINE, BODY_SIZE, scaledText, useExamTextScale } from '@/features/exam/textScale';
import { colors, radius, spacing } from '@/theme';
import type { ExamPassagePublic } from '@/types/exam';
import type { ExercisePublic, PartState, SavedAnswer } from '@/types/examSimulation';
import { SIM_SECTION, DONE_ID, WRITING_TEXT_ID, countWords, formatPoints } from '../format';
import { QuestionCard } from './QuestionCard';
import { SimAudio } from './SimAudio';
import { resolveUploadUrl } from '@/utils/urls';
import { Image } from 'expo-image';

type OnAnswer = (questionId: string, answer: string | null, flagged: boolean) => void;

type Ctx = {
  attemptId: string;
  part: PartState;
  answers: Record<string, SavedAnswer>;
  disabled: boolean;
  color: string;
  onAnswer: OnAnswer;
};

/** A passage: a listening clip (counted plays) with its text, or a readable text card. */
function PassageBlock({ ctx, passage, title }: { ctx: Ctx; passage: ExamPassagePublic; title?: string }) {
  const audio = resolveUploadUrl(passage.audioUrl);
  if (!audio) return <ReadingCard passages={[passage]} title={title ?? (passage.label || 'Text')} color={ctx.color} />;
  const image = resolveUploadUrl(passage.imageUrl);
  return (
    <View style={[styles.clip, { borderColor: tint(ctx.color, '33') }]}>
      {passage.label ? <AppText variant="subheading">{passage.label}</AppText> : null}
      <SimAudio
        attemptId={ctx.attemptId}
        partKey={ctx.part.key}
        passageId={passage.id}
        label={passage.label}
        src={audio}
        maxPlays={ctx.part.maxAudioPlays}
        initialPlaysUsed={ctx.part.audioPlays?.[passage.id] ?? 0}
        disabled={ctx.disabled}
        color={ctx.color}
      />
      {image ? <Image source={{ uri: image }} contentFit="contain" style={styles.image} accessibilityIgnoresInvertColors /> : null}
      {passage.content ? <RichContent content={withGapMarkers(passage.content)} /> : null}
    </View>
  );
}

function ObjectiveExercise({ ctx, exercise, startNumber }: { ctx: Ctx; exercise: ExercisePublic; startNumber: number }) {
  const { part, answers, disabled, color, onAnswer } = ctx;
  const listening = part.section === 'HOERVERSTEHEN';
  const situation = exercise.taskType === 'SITUATION_MATCHING';
  const pool = exercise.answerOptions ?? [];
  const signPool = listening && pool.length >= 2;
  const showPool = !signPool && pool.length > 0 && (exercise.taskType === 'MATCHING' || exercise.taskType === 'WORD_BANK_CLOZE');

  // A text a question points at is shown right before its first question; everything else (running texts, ads) up front.
  const { upfront, before } = useMemo(() => {
    const referenced = new Set(exercise.questions.map((q) => q.sectionIndex).filter((i): i is number => i != null));
    const first = new Map<string, number>();
    const seen = new Set<number>();
    for (const q of exercise.questions) {
      if (q.sectionIndex != null && !seen.has(q.sectionIndex)) {
        seen.add(q.sectionIndex);
        first.set(q.id, q.sectionIndex);
      }
    }
    return { upfront: exercise.passages.filter((_, i) => !referenced.has(i)), before: first };
  }, [exercise]);

  const used = useMemo(() => new Set(Object.values(answers).map((a) => a.answer).filter((a): a is string => !!a)), [answers]);

  return (
    <View style={{ gap: spacing.md }}>
      {exercise.teilDescription ? (
        <Card tone="accent">
          <AppText variant="small">{exercise.teilDescription}</AppText>
        </Card>
      ) : null}
      {situation && upfront.length > 0 ? (
        <ReadingCard passages={upfront} title="Anzeigen" icon="newspaper-outline" color={color} />
      ) : (
        upfront.map((p) => <PassageBlock key={p.id} ctx={ctx} passage={p} />)
      )}
      {showPool ? (
        <WordBank
          title={exercise.taskType === 'MATCHING' ? 'Zur Auswahl' : 'Wörter – nicht jedes passt in eine Lücke'}
          answerOptions={pool}
          labels={exercise.answerOptionLabels}
          color={color}
          used={used}
        />
      ) : null}
      {exercise.questions.map((q, idx) => {
        const passageIndex = before.get(q.id);
        const saved = answers[q.id];
        return (
          <View key={q.id} style={{ gap: spacing.md }}>
            {passageIndex != null && exercise.passages[passageIndex] ? <PassageBlock ctx={ctx} passage={exercise.passages[passageIndex]} /> : null}
            <QuestionCard
              exercise={exercise}
              question={q}
              number={q.questionNumber ?? startNumber + idx}
              value={saved?.answer ?? null}
              flagged={saved?.flagged ?? false}
              disabled={disabled}
              color={color}
              signPool={signPool}
              onChange={(v) => onAnswer(q.id, v, saved?.flagged ?? false)}
              onToggleFlag={() => onAnswer(q.id, saved?.answer ?? null, !(saved?.flagged ?? false))}
            />
          </View>
        );
      })}
    </View>
  );
}

function WritingExercise({ ctx, exercise }: { ctx: Ctx; exercise: ExercisePublic }) {
  const scale = useExamTextScale();
  const text = ctx.answers[WRITING_TEXT_ID]?.answer ?? '';
  const words = countWords(text);
  return (
    <View style={{ gap: spacing.md }}>
      {exercise.teilDescription ? (
        <Card tone="accent">
          <AppText variant="small">{exercise.teilDescription}</AppText>
        </Card>
      ) : null}
      <Card style={{ gap: spacing.md }}>
        {exercise.passages.map((p) => (
          <PassageBody key={p.id} passage={p} />
        ))}
      </Card>
      {exercise.leitpunkte && exercise.leitpunkte.length > 0 ? (
        <Card style={{ gap: spacing.xs }}>
          {exercise.leitpunkte.map((l) => (
            <View key={l} style={styles.bullet}>
              <AppText color={ctx.color}>•</AppText>
              <AppText style={[{ flex: 1 }, scaledText(BODY_SIZE, BODY_LINE, scale)]}>{l}</AppText>
            </View>
          ))}
        </Card>
      ) : null}
      <View style={{ gap: spacing.xs }}>
        <AppText variant="subheading">Deine Antwort</AppText>
        <TextInput
          accessibilityLabel="Deine Antwort"
          value={text}
          editable={!ctx.disabled}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
          maxLength={20000}
          autoCorrect={false}
          spellCheck={false}
          placeholder="Schreibe hier deinen Text …"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={(v) => ctx.onAnswer(WRITING_TEXT_ID, v, false)}
          style={[styles.input, { borderColor: text ? tint(ctx.color, '33') : colors.border }, scaledText(BODY_SIZE, BODY_LINE, scale)]}
        />
        <AppText variant="caption" color={colors.mutedForeground} accessibilityLiveRegion="polite">
          {words} {words === 1 ? 'Wort' : 'Wörter'}
        </AppText>
      </View>
    </View>
  );
}

function SpeakingStimulus({ exercise }: { exercise: ExercisePublic }) {
  const s = exercise.speaking;
  if (!s) return null;
  return (
    <Card style={{ gap: spacing.sm }}>
      {s.topic ? <AppText variant="subheading">{s.topic}</AppText> : null}
      {(s.topics ?? []).map((t) => (
        <View key={t.id} style={styles.topic}>
          <AppText>{t.title}</AppText>
        </View>
      ))}
      {s.person ? (
        <AppText style={{ fontWeight: '600' }}>
          {[s.person.name, s.person.age != null ? `${s.person.age} Jahre` : null, s.person.occupation].filter(Boolean).join(', ')}
        </AppText>
      ) : null}
      {s.opinionText ? <AppText style={styles.quote}>{s.opinionText}</AppText> : null}
      {s.scenario ? <AppText>{s.scenario}</AppText> : null}
      {(s.planningPoints ?? []).map((p) => (
        <View key={p.id} style={styles.bullet}>
          <AppText>•</AppText>
          <AppText style={{ flex: 1 }}>{p.title}</AppText>
        </View>
      ))}
    </Card>
  );
}

function OralExercise({ ctx, exercise }: { ctx: Ctx; exercise: ExercisePublic }) {
  const done = ctx.answers[DONE_ID]?.answer === 'true';
  return (
    <View style={{ gap: spacing.md }}>
      <View style={[styles.notice, { backgroundColor: tint(ctx.color, '14') }]}>
        <Ionicons name="mic-outline" size={22} color={ctx.color} />
        <AppText variant="small" style={{ flex: 1 }}>
          Mündliche Übung – sprich laut, am besten mit Partnerin oder Partner. Dieser Teil wird in der Simulation nicht bewertet. Markiere unten, wenn du ihn geübt hast.
        </AppText>
      </View>
      {exercise.teilDescription ? <AppText variant="small" color={colors.mutedForeground}>{exercise.teilDescription}</AppText> : null}
      {exercise.passages.map((p) => (
        <PassageBlock key={p.id} ctx={ctx} passage={p} />
      ))}
      <SpeakingStimulus exercise={exercise} />
      {!ctx.part.previewOnly ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done, disabled: ctx.disabled }}
          disabled={ctx.disabled}
          onPress={() => ctx.onAnswer(DONE_ID, done ? null : 'true', false)}
          style={[styles.doneButton, done && { backgroundColor: colors.successSoft, borderColor: colors.success }]}
        >
          <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? colors.success : colors.mutedForeground} />
          <AppText style={{ fontWeight: '700' }}>{done ? 'Teil geübt' : 'Als geübt markieren'}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

type Props = {
  attemptId: string;
  part: PartState;
  answers: Record<string, SavedAnswer>;
  disabled: boolean;
  onAnswer: OnAnswer;
};

/** One part of the running exam: every exercise of the part, rendered for its kind. */
export function PartView({ attemptId, part, answers, disabled, onAnswer }: Props) {
  const meta = SIM_SECTION[part.section];
  const color = meta.color;
  const locked = disabled || part.previewOnly;
  const ctx: Ctx = { attemptId, part, answers, disabled: locked, color, onAnswer };
  const questionCount = part.exercises.reduce((n, e) => n + e.questions.length, 0);
  const listening = part.section === 'HOERVERSTEHEN' && part.module !== 'ORAL';
  const chips = [
    questionCount > 0 ? `${questionCount} ${questionCount === 1 ? 'Frage' : 'Fragen'}` : null,
    part.maxPoints > 0 && part.scoringMethod !== 'UNSCORED' ? `${formatPoints(part.maxPoints)} Punkte` : null,
    listening && part.maxAudioPlays != null ? `Audio ${part.maxAudioPlays === 1 ? 'einmal' : `${part.maxAudioPlays}-mal`}` : null,
  ].filter(Boolean);

  return (
    <View style={{ gap: spacing.md }} accessibilityLabel={part.label}>
      <View style={[styles.header, { backgroundColor: color }]}>
        <View style={styles.headerIcon}>
          <Ionicons name={meta.icon} size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText style={styles.headerTitle} accessibilityRole="header">
            {part.label}
          </AppText>
          {chips.length > 0 ? (
            <View style={styles.chips}>
              {chips.map((c) => (
                <View key={c} style={styles.chip}>
                  <AppText variant="caption" color="#FFFFFF" style={{ fontWeight: '700' }}>
                    {c}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
      {part.previewOnly ? (
        <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
          <Ionicons name="eye-outline" size={22} color={colors.warning} />
          <AppText variant="small" style={{ flex: 1 }}>
            Vorbereitungszeit: Du siehst die Aufgaben schon jetzt. Antworten werden erst in der Übungszeit gespeichert.
          </AppText>
        </View>
      ) : null}
      {part.exercises.map((exercise, index) => {
        const start = 1 + part.exercises.slice(0, index).reduce((n, e) => n + e.questions.length, 0);
        if (part.section === 'SCHRIFTLICHER_AUSDRUCK') return <WritingExercise key={exercise.ordinal} ctx={ctx} exercise={exercise} />;
        if (part.module === 'ORAL') return <OralExercise key={exercise.ordinal} ctx={ctx} exercise={exercise} />;
        return <ObjectiveExercise key={exercise.ordinal} ctx={ctx} exercise={exercise} startNumber={start} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.22)' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
  clip: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, backgroundColor: colors.surface },
  image: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.muted },
  bullet: { flexDirection: 'row', gap: spacing.sm },
  input: {
    minHeight: 260,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    color: colors.foreground,
  },
  topic: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  quote: { paddingLeft: spacing.md, borderLeftWidth: 4, borderLeftColor: colors.border, fontStyle: 'italic' },
  doneButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
