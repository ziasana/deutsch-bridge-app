import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type {
  WritingExampleData,
  WritingFormatData,
  WritingLearningResponse,
  WritingMistakeData,
  WritingPhrase,
  WritingSentencePatternData,
  WritingStrategyData,
  WritingStructureData,
} from '@/types/writing';
import { tint } from '../../components/kit';
import { LEARN_SECTIONS, itemsOfKind, phraseCategoryLabels, type LearnSectionId } from '../writingMeta';
import { ChoiceQuiz, DiscoverText, FlashDeck, OrderGame, TapChecklist } from './games';
import { seededRandom, shuffled } from './random';
import type { LessonStep, Station, StepApi } from './types';
import { Chips, Lead, Slide, Tinted, WRITING_COLOR } from './ui';

const Eyebrow = ({ children }: { children: string }) => (
  <AppText variant="caption" color={colors.mutedForeground} style={{ fontWeight: '800', letterSpacing: 0.6 }}>
    {children.toUpperCase()}
  </AppText>
);

function formatSteps(data: WritingLearningResponse): LessonStep[] {
  const steps: LessonStep[] = [];
  for (const item of itemsOfKind<WritingFormatData>(data, 'FORMAT')) {
    steps.push({
      id: `format-${item.id}`,
      render: () => (
        <Slide emoji="🎯" eyebrow="Prüfungsformat" title={item.title}>
          {item.content ? <Lead>{item.content}</Lead> : null}
          {item.data?.time ? (
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={18} color={colors.ink} />
              <AppText style={{ fontWeight: '600' }}>Schreibzeit: {item.data.time}</AppText>
            </View>
          ) : null}
        </Slide>
      ),
    });
    const reqs = item.data?.requirements ?? [];
    if (reqs.length > 0) {
      steps.push({
        id: `format-req-${item.id}`,
        gated: true,
        render: (api) => (
          <TapChecklist api={api} prompt="Das musst du beachten – tippe jeden Punkt an, wenn du ihn verstanden hast." items={reqs} />
        ),
      });
    }
  }
  return steps;
}

function strategySteps(data: WritingLearningResponse, seed: string): LessonStep[] {
  const items = itemsOfKind<WritingStrategyData>(data, 'STRATEGY_STEP');
  if (items.length === 0) return [];
  const steps: LessonStep[] = [
    {
      id: 'strategy-intro',
      render: () => (
        <Slide emoji="🧠" eyebrow="Schreibstrategie" title={`${items.length} Schritte zu einem guten Text`}>
          <Lead>Mit diesem Ablauf löst du jede Schreibaufgabe – immer in derselben Reihenfolge.</Lead>
          <View style={styles.flow}>
            {items.map((s, i) => (
              <View key={s.id} style={styles.flowItem}>
                <View style={[styles.flowPill, { backgroundColor: tint(WRITING_COLOR, '1F') }]}>
                  <AppText variant="small" color={WRITING_COLOR} style={{ fontWeight: '700' }}>{s.title}</AppText>
                </View>
                {i < items.length - 1 ? <Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} /> : null}
              </View>
            ))}
          </View>
        </Slide>
      ),
    },
  ];
  items.forEach((s, i) => {
    steps.push({
      id: `strategy-${s.id}`,
      render: () => (
        <Slide eyebrow={`Schritt ${i + 1} von ${items.length}`} title={s.title}>
          {s.content ? <Lead>{s.content}</Lead> : null}
          {s.data?.tips?.map((t) => (
            <Tinted key={t}>
              <View style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <AppText style={{ flex: 1 }}>{t}</AppText>
              </View>
            </Tinted>
          ))}
        </Slide>
      ),
    });
  });
  if (items.length >= 3) {
    steps.push({
      id: 'strategy-order',
      gated: true,
      render: (api) => (
        <OrderGame
          api={api}
          variant="list"
          seed={`${seed}-order`}
          prompt="Bring die Schritte in die richtige Reihenfolge."
          items={items.map((s) => s.title)}
          explanation="So gehst du bei jeder Schreibaufgabe vor."
        />
      ),
    });
  }
  return steps;
}

const MAX_QUESTIONS = 4;
const MAX_EXAMPLE_LENGTH = 90;

function structureSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
  const parts = itemsOfKind<WritingStructureData>(data, 'STRUCTURE_PART');
  if (parts.length === 0) return [];
  const rand = seededRandom(seed);
  const steps: LessonStep[] = [
    {
      id: 'structure-intro',
      render: () => (
        <Slide emoji="🧱" eyebrow="Textaufbau" title="So ist ein guter Text gebaut">
          {parts.map((p, i) => (
            <View key={p.id} style={styles.partRow}>
              <View style={[styles.partNum, { backgroundColor: tint(WRITING_COLOR, '1F') }]}>
                <AppText variant="small" color={WRITING_COLOR} style={{ fontWeight: '800' }}>{i + 1}</AppText>
              </View>
              <AppText style={{ fontWeight: '700', flex: 1 }}>{p.title}</AppText>
            </View>
          ))}
        </Slide>
      ),
    },
  ];
  parts.forEach((p, i) => {
    steps.push({
      id: `structure-${p.id}`,
      render: () => (
        <Slide eyebrow={`Teil ${i + 1} von ${parts.length}`} title={p.title}>
          {p.content ? (
            <Lead>
              <AppText style={{ fontWeight: '800', fontSize: 17 }}>Zweck: </AppText>
              {p.content}
            </Lead>
          ) : null}
          {p.data?.examples?.length ? (
            <View style={{ gap: spacing.sm }}>
              <Eyebrow>Beispiele</Eyebrow>
              {p.data.examples.map((e) => (
                <Tinted key={e}><AppText>{e}</AppText></Tinted>
              ))}
            </View>
          ) : null}
          {p.data?.phrases?.length ? (
            <View style={{ gap: spacing.sm }}>
              <Eyebrow>Passende Redemittel</Eyebrow>
              <Chips items={p.data.phrases} />
            </View>
          ) : null}
        </Slide>
      ),
    });
  });

  // "Which part does this sentence belong to?": one example per part, so questions are varied.
  const candidates = shuffled(parts, rand)
    .map((p) => ({ part: p, example: (p.data?.examples ?? []).find((e) => e.length <= MAX_EXAMPLE_LENGTH) }))
    .filter((c): c is { part: (typeof parts)[number]; example: string } => !!c.example)
    .slice(0, MAX_QUESTIONS);
  if (parts.length >= 2) {
    candidates.forEach((c, i) => {
      steps.push({
        id: `structure-quiz-${c.part.id}`,
        gated: true,
        render: (api) => (
          <ChoiceQuiz
            api={api}
            salt={i}
            question="Zu welchem Teil des Textes gehört dieser Satz?"
            quote={c.example}
            options={parts.map((p) => ({ id: p.id, label: p.title }))}
            correctId={c.part.id}
            explanation={c.part.content}
          />
        ),
      });
    });
  }
  return steps;
}

const QUIZ_PER_EXAMPLE = 2;

function exampleSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
  const steps: LessonStep[] = [];
  const rand = seededRandom(seed);
  for (const ex of itemsOfKind<WritingExampleData>(data, 'EXAMPLE')) {
    const sections = ex.data?.sections ?? [];
    if (sections.length === 0) continue;
    steps.push({
      id: `example-read-${ex.id}`,
      render: () => (
        <Slide emoji="📖" eyebrow="Mustertext" title={ex.title}>
          {ex.content ? (
            <Tinted>
              <Eyebrow>Aufgabenstellung</Eyebrow>
              <AppText>{ex.content}</AppText>
            </Tinted>
          ) : null}
          <View style={styles.model}>
            <AppText style={{ fontSize: 16, lineHeight: 25 }}>{sections.map((s) => s.text).join('\n\n')}</AppText>
          </View>
        </Slide>
      ),
    });
    steps.push({
      id: `example-discover-${ex.id}`,
      gated: true,
      render: (api) => <DiscoverText api={api} sections={sections} />,
    });
    // "Which part is this?": labels must be unique so each question has exactly one right answer.
    const labels = Array.from(new Set(sections.map((s) => s.label)));
    if (labels.length >= 3) {
      shuffled(sections, rand)
        .slice(0, QUIZ_PER_EXAMPLE)
        .forEach((s, i) => {
          steps.push({
            id: `example-quiz-${ex.id}-${s.key}`,
            gated: true,
            render: (api) => (
              <ChoiceQuiz
                api={api}
                salt={i}
                question="Welcher Teil des Textes ist das?"
                quote={s.text.replace(/\n+/g, ' ')}
                options={labels.map((l) => ({ id: l, label: l }))}
                correctId={s.label}
                explanation={s.why}
              />
            ),
          });
        });
    }
  }
  return steps;
}

const PHRASE_QUESTIONS = 5;
const PHRASE_OPTIONS = 4;

function phraseSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
  const phrases = data.phrases;
  if (phrases.length === 0) return [];
  const rand = seededRandom(seed);
  const steps: LessonStep[] = [
    {
      id: 'phrases-intro',
      render: () => (
        <Slide emoji="💬" eyebrow="Redemittel" title="Sag es mit den richtigen Worten">
          <Lead>
            Redemittel sind feste Ausdrücke für eine bestimmte Funktion – zum Beispiel um eine Meinung zu äußern, etwas zu begründen oder höflich zu bitten.
          </Lead>
          <AppText color={colors.mutedForeground}>Zuerst übst du sie nach Funktion, dann testest du dich.</AppText>
        </Slide>
      ),
    },
    { id: 'phrases-deck', render: (api: StepApi) => <FlashDeck api={api} phrases={phrases} /> },
  ];
  const labels = phraseCategoryLabels(phrases);
  const categories = Object.keys(labels);
  if (categories.length >= 3) {
    const byCategory = shuffled(categories, rand).map((c) => shuffled(phrases.filter((p) => p.category === c), rand)[0]);
    const picked: WritingPhrase[] = byCategory.slice(0, PHRASE_QUESTIONS);
    picked.forEach((p, i) => {
      const distractors = shuffled(categories.filter((c) => c !== p.category), rand).slice(0, PHRASE_OPTIONS - 1);
      const options = shuffled([p.category, ...distractors], rand).map((c) => ({ id: c, label: labels[c] }));
      steps.push({
        id: `phrases-quiz-${p.id}`,
        gated: true,
        render: (api) => (
          <ChoiceQuiz
            api={api}
            salt={i}
            question="Wofür verwendest du dieses Redemittel?"
            quote={p.phrase}
            options={options}
            correctId={p.category}
            explanation={p.example ? `Zum Beispiel: ${p.example}` : null}
          />
        ),
      });
    });
  }
  return steps;
}

const MIN_WORDS = 4;
const MAX_WORDS = 14;

/** The shortest example that is a sensible word-order puzzle (not too short, not unwieldy on a phone). */
function puzzleSentence(examples: string[]): string | null {
  return (
    examples
      .filter((e) => {
        const n = e.trim().split(/\s+/).length;
        return n >= MIN_WORDS && n <= MAX_WORDS && !e.includes('…');
      })
      .sort((a, b) => a.length - b.length)[0] ?? null
  );
}

function patternSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
  const patterns = itemsOfKind<WritingSentencePatternData>(data, 'SENTENCE_PATTERN');
  return patterns.map((p, i) => {
    const examples = p.data?.examples ?? [];
    const sentence = puzzleSentence(examples);
    const card = (
      <View style={[styles.pattern, { borderColor: tint(WRITING_COLOR, '33'), backgroundColor: tint(WRITING_COLOR, '14') }]}>
        <AppText variant="caption" color={WRITING_COLOR} style={{ fontWeight: '800', letterSpacing: 0.6 }}>
          {`SATZBAUSTEIN ${i + 1} VON ${patterns.length}`}
        </AppText>
        <AppText style={{ fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.ink }}>{p.title}</AppText>
        {p.content ? <AppText color={colors.mutedForeground}>{p.content}</AppText> : null}
      </View>
    );
    if (!sentence) {
      return {
        id: `pattern-${p.id}`,
        render: () => (
          <View style={{ gap: spacing.lg }}>
            {card}
            {examples.map((e) => (
              <Tinted key={e}><AppText>{e}</AppText></Tinted>
            ))}
          </View>
        ),
      };
    }
    return {
      id: `pattern-${p.id}`,
      gated: true,
      render: (api: StepApi) => (
        <View style={{ gap: spacing.xl }}>
          {card}
          <OrderGame
            api={api}
            variant="words"
            seed={`${seed}-${p.id}`}
            prompt="Baue den Beispielsatz:"
            items={sentence.trim().split(/\s+/)}
            explanation={p.content}
          />
        </View>
      ),
    };
  });
}

function mistakeSteps(data: WritingLearningResponse, seed: string): LessonStep[] {
  const mistakes = itemsOfKind<WritingMistakeData>(data, 'MISTAKE');
  const rand = seededRandom(seed);
  return mistakes.map((m, i) => {
    const { wrong, right } = m.data ?? {};
    if (!wrong || !right) {
      return {
        id: `mistake-${m.id}`,
        render: () => (
          <Slide emoji="⚠️" eyebrow={`Fehler ${i + 1} von ${mistakes.length}`} title={m.title}>
            {m.content ? <Lead>{m.content}</Lead> : null}
          </Slide>
        ),
      };
    }
    const options = shuffled([{ id: 'wrong', label: wrong }, { id: 'right', label: right }], rand);
    return {
      id: `mistake-${m.id}`,
      gated: true,
      render: (api: StepApi) => (
        <View style={{ gap: spacing.md }}>
          <AppText variant="caption" color={WRITING_COLOR} style={{ fontWeight: '800', letterSpacing: 0.6 }}>
            {`⚠️ FEHLER ${i + 1} VON ${mistakes.length} – ${m.title.toUpperCase()}`}
          </AppText>
          <ChoiceQuiz api={api} salt={i} question="Welche Version ist besser?" options={options} correctId="right" explanation={m.content} />
        </View>
      ),
    };
  });
}

const CHECK_CHUNK = 5;

function checklistSteps(data: WritingLearningResponse): LessonStep[] {
  const items = itemsOfKind(data, 'CHECKLIST_ITEM');
  if (items.length === 0) return [];
  const titles = items.map((i) => i.title);
  const chunks: string[][] = [];
  for (let i = 0; i < titles.length; i += CHECK_CHUNK) chunks.push(titles.slice(i, i + CHECK_CHUNK));
  return [
    {
      id: 'checklist-intro',
      render: () => (
        <Slide emoji="✅" eyebrow="Checkliste" title="Dein Check vor dem Abgeben">
          <Lead>Gehe diese Fragen bei jedem Text durch. Du kannst sie später auch in der Schreibaufgabe im Kopf abhaken.</Lead>
        </Slide>
      ),
    },
    ...chunks.map((chunk, i) => ({
      id: `checklist-tap-${i}`,
      render: (api: StepApi) => (
        <TapChecklist
          api={api}
          prompt={chunks.length > 1 ? `Meine Schreib-Checkliste (${i + 1}/${chunks.length})` : 'Meine Schreib-Checkliste'}
          items={chunk}
          requireAll={false}
        />
      ),
    })),
  ];
}

/** Builds the lesson steps for every station that has content for the level, in learning order. */
export function buildStations(data: WritingLearningResponse, level: string): Station[] {
  const seed = (id: LearnSectionId) => `${level}-${id}`;
  const byId: Record<LearnSectionId, LessonStep[]> = {
    format: formatSteps(data),
    strategie: strategySteps(data, seed('strategie')),
    aufbau: structureSteps(data, seed('aufbau')),
    beispiele: exampleSteps(data, seed('beispiele')),
    redemittel: phraseSteps(data, seed('redemittel')),
    satzbausteine: patternSteps(data, seed('satzbausteine')),
    fehler: mistakeSteps(data, seed('fehler')),
    checkliste: checklistSteps(data),
  };
  return LEARN_SECTIONS.filter((s) => byId[s.id].length > 0).map((s) => ({ id: s.id, steps: byId[s.id] }));
}

const styles = StyleSheet.create({
  timeTag: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  flow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  flowItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flowPill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: tint(WRITING_COLOR, '33'),
    backgroundColor: colors.surface,
  },
  partNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  model: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pattern: { gap: 4, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 2 },
});
