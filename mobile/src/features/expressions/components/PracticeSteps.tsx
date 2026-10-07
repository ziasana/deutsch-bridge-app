import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Card, TextField, ErrorNotice } from '@/components/ui';
import { tint } from '@/features/exam/components/kit';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import type { PracticeExpression, PracticeQuestion } from '@/types/expression';
import {
  useProductionAnswer,
  useQuestionAnswer,
  useRecallAnswer,
  useTransformationAnswer,
} from '../hooks';
import { EXPRESSION_COLOR, EXPRESSION_DARK } from '../labels';
import { meaningLine, sentenceOutcome } from '../practiceLogic';

/** Every step reports its outcome: true/false = judged, null = informational or skipped. */
type Done = (outcome: boolean | null) => void;

const STEP_INTRO = {
  recall: 'Welche Wörter fehlen?',
  context: 'Welche Situation passt zu dieser Wendung?',
  completion: 'Wähle die richtige Ergänzung.',
  transformation: 'Formuliere den Satz um.',
  production: 'Jetzt bist du dran.',
} as const;

const Eyebrow = ({ children }: { children: string }) => (
  <AppText variant="caption" color={EXPRESSION_DARK}>
    {children.toUpperCase()}
  </AppText>
);

const Verdict = ({ ok, children }: { ok: boolean; children: string }) => (
  <AppText color={ok ? '#1B7A55' : colors.destructive}>
    {ok ? '✓' : '✕'} {children}
  </AppText>
);

export function DiscoverStep({
  item,
  persian,
  onDone,
}: {
  item: PracticeExpression;
  persian: boolean;
  onDone: Done;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={styles.gap}>
      <AppText variant="title">{item.expression}</AppText>
      {!revealed ? (
        <>
          <AppText color={colors.mutedForeground}>Was glaubst du, was bedeutet das?</AppText>
          <Button
            label="Bedeutung anzeigen"
            onPress={() => setRevealed(true)}
            color={EXPRESSION_COLOR}
          />
        </>
      ) : (
        <>
          <Card tone="accent" style={styles.gap}>
            <AppText variant="subheading">= {item.meaningDe}</AppText>
            {item.meaningEn ? (
              <AppText color={colors.mutedForeground}>🇬🇧 {item.meaningEn}</AppText>
            ) : null}
            {persian && item.meaningFa ? (
              <AppText color={colors.mutedForeground} style={styles.rtl}>
                🇮🇷 {item.meaningFa}
              </AppText>
            ) : null}
            {item.grammarNote ? (
              <AppText variant="small" color={colors.mutedForeground}>
                Grammatik: {item.grammarNote}
              </AppText>
            ) : null}
          </Card>
          {item.exampleSentence ? (
            <AppText style={{ fontStyle: 'italic' }}>„{item.exampleSentence}“</AppText>
          ) : null}
          <Button label="Weiter zur Übung" onPress={() => onDone(null)} color={EXPRESSION_COLOR} />
        </>
      )}
    </View>
  );
}

export function RecallStep({
  item,
  isLast,
  onDone,
}: {
  item: PracticeExpression;
  isLast: boolean;
  onDone: Done;
}) {
  const [answer, setAnswer] = useState('');
  const recall = useRecallAnswer(item.expressionId);
  const result = recall.data;
  const submit = () => answer.trim() && !recall.isPending && recall.mutate(answer.trim());
  return (
    <View style={styles.gap}>
      <Eyebrow>{STEP_INTRO.recall}</Eyebrow>
      <AppText variant="heading">
        {item.maskedSentence ?? `Wie sagt man: „${meaningLine(item.meaningDe, null)}“?`}
      </AppText>
      <TextField
        label="Deine Antwort"
        value={answer}
        editable={!result}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onChangeText={setAnswer}
        onSubmitEditing={submit}
      />
      {recall.error ? <ErrorNotice error={recall.error} /> : null}
      {!result ? (
        <Button
          label="Prüfen"
          loading={recall.isPending}
          disabled={!answer.trim()}
          onPress={submit}
          color={EXPRESSION_COLOR}
        />
      ) : (
        <>
          <Card tone="accent" style={styles.gap}>
            <Verdict ok={result.correct}>{result.correct ? 'Richtig!' : 'Nicht ganz.'}</Verdict>
            {!result.correct ? <AppText>Richtig wäre: {result.correctAnswer}</AppText> : null}
          </Card>
          <Button
            label={isLast ? 'Weiter' : 'Weiter'}
            onPress={() => onDone(result.correct)}
            color={EXPRESSION_COLOR}
          />
        </>
      )}
    </View>
  );
}

function Options({
  options,
  selected,
  correctId,
  onSelect,
  locked,
}: {
  options: PracticeQuestion['options'];
  selected: string | null;
  correctId: string | null;
  onSelect: (id: string) => void;
  locked: boolean;
}) {
  return (
    <View style={styles.gap}>
      {options.map((o, i) => {
        const isRight = locked && o.id === correctId;
        const isWrong = locked && o.id === selected && o.id !== correctId;
        const mark = isRight ? '✓' : isWrong ? '✕' : String.fromCharCode(65 + i);
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityLabel={o.text}
            accessibilityState={{ selected: o.id === selected, disabled: locked }}
            disabled={locked}
            onPress={() => onSelect(o.id)}
            style={[
              styles.option,
              !locked && o.id === selected && styles.picked,
              isRight && styles.right,
              isWrong && styles.wrong,
            ]}
          >
            <View style={styles.letter}>
              <AppText variant="small" style={{ fontWeight: '700' }}>
                {mark}
              </AppText>
            </View>
            <AppText style={styles.optionText}>{o.text}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function McqStep({
  item,
  question,
  intro,
  onDone,
}: {
  item: PracticeExpression;
  question: PracticeQuestion;
  intro: keyof typeof STEP_INTRO;
  onDone: Done;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answer = useQuestionAnswer(item.expressionId);
  const result = answer.data;
  return (
    <View style={styles.gap}>
      <Eyebrow>{STEP_INTRO[intro]}</Eyebrow>
      <AppText variant="heading">{question.prompt}</AppText>
      <Options
        options={question.options}
        selected={selected}
        correctId={result?.correctOptionId ?? null}
        onSelect={setSelected}
        locked={!!result}
      />
      {answer.error ? <ErrorNotice error={answer.error} /> : null}
      {!result ? (
        <Button
          label="Prüfen"
          loading={answer.isPending}
          disabled={!selected}
          onPress={() => selected && answer.mutate({ questionId: question.id, optionId: selected })}
          color={EXPRESSION_COLOR}
        />
      ) : (
        <>
          <Verdict ok={result.correct}>{result.correct ? 'Richtig!' : 'Nicht richtig'}</Verdict>
          {result.explanation ? (
            <AppText color={colors.mutedForeground}>{result.explanation}</AppText>
          ) : null}
          <Button label="Weiter" onPress={() => onDone(result.correct)} color={EXPRESSION_COLOR} />
        </>
      )}
    </View>
  );
}

type Criterion = { label: string; ok: boolean };
type Judged = {
  criteria: Criterion[];
  feedback: string;
  c1Suggestion: string | null;
  outcome: boolean;
};

/** Free-text step judged by the backend's AI; shared by "transformation" and "production". */
function SentenceStep({
  intro,
  promptNode,
  placeholder,
  submitLabel,
  nextLabel,
  isPending,
  error,
  judged,
  userSentence,
  onSubmit,
  onDone,
}: {
  intro: keyof typeof STEP_INTRO;
  promptNode: React.ReactNode;
  placeholder: string;
  submitLabel: string;
  nextLabel: string;
  isPending: boolean;
  error: string | undefined;
  judged: Judged | undefined;
  userSentence: string;
  onSubmit: (sentence: string) => void;
  onDone: Done;
}) {
  const [sentence, setSentence] = useState('');
  return (
    <View style={styles.gap}>
      <Eyebrow>{STEP_INTRO[intro]}</Eyebrow>
      {promptNode}
      {!judged ? (
        <>
          <TextField
            label={placeholder}
            multiline
            value={sentence}
            onChangeText={setSentence}
            autoCapitalize="sentences"
            returnKeyType="default"
          />
          {error ? (
            <View style={styles.gap}>
              <ErrorNotice message={error} />
              {/* An AI limit or outage must never trap the learner in the last step. */}
              <Button
                label="Schritt überspringen"
                variant="ghost"
                onPress={() => onDone(null)}
                color={EXPRESSION_DARK}
              />
            </View>
          ) : null}
          <Button
            label={submitLabel}
            loading={isPending}
            disabled={!sentence.trim()}
            onPress={() => onSubmit(sentence.trim())}
            color={EXPRESSION_COLOR}
          />
        </>
      ) : (
        <>
          <Card tone="accent" style={styles.gap}>
            <AppText variant="small" color={colors.mutedForeground}>
              Dein Satz:
            </AppText>
            <AppText>{userSentence}</AppText>
            {judged.criteria.map((c) => (
              <Verdict key={c.label} ok={c.ok}>
                {c.label}
              </Verdict>
            ))}
            {judged.feedback ? <AppText>{judged.feedback}</AppText> : null}
            {judged.c1Suggestion ? (
              <View style={styles.suggestion}>
                <AppText variant="small" color={colors.mutedForeground}>
                  C1-Vorschlag:
                </AppText>
                <AppText>{judged.c1Suggestion}</AppText>
              </View>
            ) : null}
          </Card>
          <Button
            label={nextLabel}
            onPress={() => onDone(judged.outcome)}
            color={EXPRESSION_COLOR}
          />
        </>
      )}
    </View>
  );
}

export function TransformationSentenceStep({
  item,
  question,
  onDone,
}: {
  item: PracticeExpression;
  question: PracticeQuestion;
  onDone: Done;
}) {
  const mutation = useTransformationAnswer(item.expressionId);
  const r = mutation.data;
  return (
    <SentenceStep
      intro="transformation"
      promptNode={
        <AppText variant="heading" style={{ fontStyle: 'italic' }}>
          „{question.prompt}“
        </AppText>
      }
      placeholder="Dein umformulierter Satz"
      submitLabel="Absenden"
      nextLabel="Weiter"
      isPending={mutation.isPending}
      error={mutation.error?.message}
      userSentence={mutation.variables?.sentence ?? ''}
      judged={
        r && {
          criteria: [
            { label: 'Wendung verwendet', ok: r.usedExpression },
            { label: 'Grammatik korrekt', ok: r.grammarCorrect },
            { label: 'Bedeutung erhalten', ok: r.meaningPreserved },
          ],
          feedback: r.feedback,
          c1Suggestion: r.c1Suggestion,
          outcome: sentenceOutcome(r.usedExpression, r.grammarCorrect),
        }
      }
      onSubmit={(sentence) => mutation.mutate({ questionId: question.id, sentence })}
      onDone={onDone}
    />
  );
}

export function ProductionStep({
  item,
  isLastItem,
  onDone,
}: {
  item: PracticeExpression;
  isLastItem: boolean;
  onDone: Done;
}) {
  const mutation = useProductionAnswer(item.expressionId);
  const r = mutation.data;
  return (
    <SentenceStep
      intro="production"
      promptNode={
        <AppText variant="heading">
          Schreibe einen eigenen Satz mit:{' '}
          <AppText variant="heading" color={EXPRESSION_DARK}>
            {item.expression}
          </AppText>
        </AppText>
      }
      placeholder="Dein Satz"
      submitLabel="Absenden"
      nextLabel={isLastItem ? 'Session beenden' : 'Nächste Wendung'}
      isPending={mutation.isPending}
      error={mutation.error?.message}
      userSentence={mutation.variables ?? ''}
      judged={
        r && {
          criteria: [
            { label: 'Wendung richtig verwendet', ok: r.usedCorrectly },
            { label: 'Grammatik korrekt', ok: r.grammarCorrect },
            { label: 'Natürlicher Satz', ok: r.natural },
          ],
          feedback: r.feedback,
          c1Suggestion: r.c1Suggestion,
          outcome: sentenceOutcome(r.usedCorrectly, r.grammarCorrect),
        }
      }
      onSubmit={(sentence) => mutation.mutate(sentence)}
      onDone={onDone}
    />
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
  rtl: { writingDirection: 'rtl', textAlign: 'right' },
  suggestion: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: 2 },
  option: {
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  picked: { borderColor: EXPRESSION_COLOR, backgroundColor: tint(EXPRESSION_COLOR, '1F') },
  right: { borderColor: colors.success, backgroundColor: colors.successSoft },
  wrong: { borderColor: colors.destructive, backgroundColor: colors.destructiveSoft },
  letter: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, fontSize: 17 },
});
