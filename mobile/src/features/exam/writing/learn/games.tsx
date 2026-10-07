import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button } from '@/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { speakGerman } from '@/utils/germanSpeech';
import type { WritingExampleSection, WritingPhrase } from '@/types/writing';
import { PressableScale, tint } from '../../components/kit';
import { FORMALITY_LABELS, phraseCategoryLabels } from '../writingMeta';
import { seededRandom, shuffledDifferent } from './random';
import type { StepApi } from './types';
import {
  CORRECT_MESSAGES,
  Feedback,
  Pop,
  Shake,
  WRITING_COLOR,
  WRONG_MESSAGES,
  buzz,
  pickMessage,
} from './ui';
import { darken } from '@/features/exam/components/kit';

const Prompt = ({ children }: { children: ReactNode }) => (
  <AppText style={styles.prompt}>{children}</AppText>
);

/* ───────────────────────── ChoiceQuiz ───────────────────────── */

export interface QuizOption {
  id: string;
  label: string;
}

/** One question, tap an answer, immediate reaction. The first tap decides whether it counts as correct. */
export function ChoiceQuiz({
  api,
  question,
  quote,
  options,
  correctId,
  explanation,
  salt = 0,
}: {
  api: StepApi;
  question: string;
  quote?: string;
  options: QuizOption[];
  correctId: string;
  explanation?: string | null;
  salt?: number;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const revealed = picked !== null || api.solved;

  const pick = (id: string) => {
    if (revealed) return;
    setPicked(id);
    const correct = id === correctId;
    if (!correct) setMisses((m) => m + 1);
    buzz(correct ? 12 : 30);
    api.complete(correct);
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.md }}>
        <Prompt>{question}</Prompt>
        {quote ? (
          <View style={styles.quote}>
            <AppText style={{ fontSize: 17, lineHeight: 25 }}>„{quote}“</AppText>
          </View>
        ) : null}
      </View>
      <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
        {options.map((o) => {
          const isCorrect = o.id === correctId;
          const isPicked = picked === o.id;
          const wrong = revealed && isPicked && !isCorrect;
          return (
            <Shake key={o.id} trigger={wrong ? misses : 0}>
              <PressableScale
                accessibilityRole="radio"
                accessibilityLabel={o.label}
                accessibilityState={{ selected: isPicked, disabled: revealed }}
                disabled={revealed}
                onPress={() => pick(o.id)}
                style={[
                  styles.option,
                  revealed && isCorrect && styles.optionRight,
                  wrong && styles.optionWrong,
                  revealed && !isCorrect && !isPicked && { opacity: 0.55 },
                ]}
              >
                <AppText style={{ flex: 1, fontWeight: '600' }}>{o.label}</AppText>
                {revealed && isCorrect ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                ) : null}
                {wrong ? <Ionicons name="close-circle" size={24} color={colors.warning} /> : null}
              </PressableScale>
            </Shake>
          );
        })}
      </View>
      {picked !== null ? (
        <Feedback
          correct={picked === correctId}
          message={pickMessage(picked === correctId ? CORRECT_MESSAGES : WRONG_MESSAGES, salt)}
          explanation={explanation}
        />
      ) : null}
    </View>
  );
}

/* ───────────────────────── TapChecklist ───────────────────────── */

/** Tap each item to confirm "got it": turns a passive list into a small interaction with a visible result. */
export function TapChecklist({
  api,
  prompt,
  items,
  requireAll = true,
}: {
  api: StepApi;
  prompt: string;
  items: string[];
  requireAll?: boolean;
}) {
  const [ticked, setTicked] = useState<ReadonlySet<number>>(new Set());
  const allDone = api.solved || ticked.size === items.length;

  const toggle = (i: number) => {
    const next = new Set(ticked);
    if (!next.delete(i)) next.add(i);
    setTicked(next);
    buzz(8);
    if (requireAll && next.size === items.length) api.complete();
    if (!requireAll) api.complete();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Prompt>{prompt}</Prompt>
      <View style={{ gap: spacing.sm }}>
        {items.map((item, i) => {
          const on = api.solved || ticked.has(i);
          return (
            <PressableScale
              key={item}
              accessibilityRole="checkbox"
              accessibilityLabel={item}
              accessibilityState={{ checked: on }}
              onPress={() => toggle(i)}
              style={[styles.option, on && styles.optionRight]}
            >
              <View
                style={[
                  styles.box,
                  on && { backgroundColor: colors.success, borderColor: colors.success },
                ]}
              >
                {on ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
              </View>
              <AppText style={{ flex: 1 }}>{item}</AppText>
            </PressableScale>
          );
        })}
      </View>
      <AppText variant="small" color={colors.mutedForeground} accessibilityLiveRegion="polite">
        {allDone ? 'Alles abgehakt – super! 🎉' : `${ticked.size} von ${items.length} abgehakt`}
      </AppText>
    </View>
  );
}

/* ───────────────────────── OrderGame ───────────────────────── */

const MAX_TRIES_BEFORE_SOLUTION = 2;

/** Tap items to build the right order. Wrong answers can be retried; after two misses the solution is offered. */
export function OrderGame({
  api,
  prompt,
  items,
  variant,
  seed,
  explanation,
}: {
  api: StepApi;
  prompt: string;
  /** Items in their correct order. */
  items: string[];
  /** "list" = numbered vertical steps; "words" = inline wrapped words forming a sentence. */
  variant: 'list' | 'words';
  seed: string;
  explanation?: string | null;
}) {
  const pool = useMemo(
    () =>
      shuffledDifferent(
        items.map((_, i) => i),
        seededRandom(seed),
      ),
    [items, seed],
  );
  const [placed, setPlaced] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct' | 'revealed'>('idle');

  const solved = api.solved || status === 'correct' || status === 'revealed';
  const shown = api.solved && status === 'idle' ? items.map((_, i) => i) : placed;
  const remaining = pool.filter((i) => !shown.includes(i));
  const wrongAt = new Set<number>(
    status === 'wrong'
      ? shown.map((idx, pos) => (items[idx] === items[pos] ? -1 : pos)).filter((p) => p >= 0)
      : [],
  );

  const place = (idx: number) => {
    if (solved) return;
    setStatus('idle');
    setPlaced((p) => [...p, idx]);
  };
  const unplace = (pos: number) => {
    if (solved) return;
    setStatus('idle');
    setPlaced((p) => p.filter((_, i) => i !== pos));
  };
  const check = () => {
    if (placed.every((idx, pos) => items[idx] === items[pos])) {
      setStatus('correct');
      buzz(12);
      api.complete(misses === 0);
    } else {
      setStatus('wrong');
      setMisses((m) => m + 1);
      buzz(30);
    }
  };
  const reveal = () => {
    setPlaced(items.map((_, i) => i));
    setStatus('revealed');
    api.complete(false);
  };

  const layout = variant === 'list' ? styles.col : styles.wrap;

  return (
    <View style={{ gap: spacing.lg }}>
      <Prompt>{prompt}</Prompt>

      <Shake trigger={status === 'wrong' ? misses : 0}>
        <View style={[styles.slots, layout]} accessibilityLabel="Deine Reihenfolge">
          {shown.length === 0 ? (
            <AppText color={colors.mutedForeground} style={{ alignSelf: 'center' }}>
              Tippe auf die Karten unten …
            </AppText>
          ) : null}
          {shown.map((idx, pos) => (
            <Pop key={`${idx}-${pos}`}>
              <Pressable
                disabled={solved}
                onPress={() => unplace(pos)}
                accessibilityRole="button"
                accessibilityLabel={`${pos + 1}. ${items[idx]} – tippen zum Entfernen`}
                style={[
                  styles.chipBtn,
                  solved
                    ? styles.optionRight
                    : wrongAt.has(pos)
                      ? styles.optionWrong
                      : { borderColor: tint(WRITING_COLOR, '33') },
                ]}
              >
                {variant === 'list' ? (
                  <View style={[styles.num, { backgroundColor: tint(WRITING_COLOR, '1F') }]}>
                    <AppText variant="caption" color={WRITING_COLOR} style={{ fontWeight: '800' }}>
                      {pos + 1}
                    </AppText>
                  </View>
                ) : null}
                <AppText style={{ fontWeight: '600' }}>{items[idx]}</AppText>
              </Pressable>
            </Pop>
          ))}
        </View>
      </Shake>

      {!solved ? (
        <>
          <View style={layout} accessibilityLabel="Karten">
            {remaining.map((idx) => (
              <PressableScale
                key={idx}
                accessibilityRole="button"
                accessibilityLabel={items[idx]}
                onPress={() => place(idx)}
                style={styles.chipBtn}
              >
                <AppText style={{ fontWeight: '600' }}>{items[idx]}</AppText>
              </PressableScale>
            ))}
          </View>
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button
                label="Prüfen"
                disabled={placed.length !== items.length}
                onPress={check}
                color={WRITING_COLOR}
              />
            </View>
            {placed.length > 0 ? (
              <Button
                label="Zurücksetzen"
                variant="ghost"
                onPress={() => {
                  setPlaced([]);
                  setStatus('idle');
                }}
                color={darken(WRITING_COLOR)}
              />
            ) : null}
          </View>
          {misses >= MAX_TRIES_BEFORE_SOLUTION ? (
            <Button
              label="Lösung zeigen"
              variant="ghost"
              onPress={reveal}
              color={darken(WRITING_COLOR)}
            />
          ) : null}
        </>
      ) : null}

      {status === 'wrong' ? (
        <Feedback
          correct={false}
          message="Noch nicht ganz – die orange markierten Karten stehen an der falschen Stelle."
        />
      ) : null}
      {status === 'correct' ? (
        <Feedback
          correct
          message={pickMessage(CORRECT_MESSAGES, items.length)}
          explanation={explanation}
        />
      ) : null}
      {status === 'revealed' ? (
        <Feedback
          correct={false}
          message="Das ist die richtige Reihenfolge. Beim nächsten Mal klappt es!"
          explanation={explanation}
        />
      ) : null}
    </View>
  );
}

/* ───────────────────────── FlashDeck ───────────────────────── */

/** Redemittel by function: pick a function, then work through its cards one at a time. */
export function FlashDeck({ api, phrases }: { api: StepApi; phrases: WritingPhrase[] }) {
  const labels = useMemo(() => phraseCategoryLabels(phrases), [phrases]);
  const categories = useMemo(() => Object.keys(labels), [labels]);
  const [category, setCategory] = useState<string | null>(null);
  const [queue, setQueue] = useState<WritingPhrase[]>([]);
  const [known, setKnown] = useState(0);
  const [finished, setFinished] = useState<ReadonlySet<string>>(new Set());
  const [speaking, setSpeaking] = useState(false);
  const stopSpeech = useRef<(() => void) | null>(null);
  useEffect(() => () => stopSpeech.current?.(), []);

  const halt = () => {
    stopSpeech.current?.();
    stopSpeech.current = null;
    setSpeaking(false);
  };
  const say = (text: string) => {
    if (speaking) return halt();
    setSpeaking(true);
    stopSpeech.current = speakGerman(text, { onDone: halt, onError: halt });
  };

  const start = (c: string) => {
    halt();
    setCategory(c);
    setQueue(phrases.filter((p) => p.category === c).sort((a, b) => a.sortOrder - b.sortOrder));
    setKnown(0);
  };
  const answer = (gotIt: boolean) => {
    halt();
    buzz(8);
    const [first, ...rest] = queue;
    const nextQueue = gotIt ? rest : [...rest, first];
    if (gotIt) setKnown((k) => k + 1);
    setQueue(nextQueue);
    if (nextQueue.length === 0 && category) {
      setFinished((f) => new Set(f).add(category));
      api.complete();
    }
  };

  if (!category) {
    return (
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: 4 }}>
          <Prompt>Wähle eine Funktion</Prompt>
          <AppText color={colors.mutedForeground}>
            Was möchtest du ausdrücken? Übe die Redemittel Karte für Karte.
          </AppText>
        </View>
        <View style={styles.grid}>
          {categories.map((c) => {
            const ok = finished.has(c) || api.solved;
            return (
              <PressableScale
                key={c}
                containerStyle={styles.gridItem}
                accessibilityRole="button"
                accessibilityLabel={labels[c]}
                onPress={() => start(c)}
                style={[styles.option, ok && styles.optionRight]}
              >
                <AppText style={{ flex: 1, fontWeight: '600' }}>{labels[c]}</AppText>
                {ok ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
              </PressableScale>
            );
          })}
        </View>
        <AppText variant="small" color={colors.mutedForeground}>
          Dieser Schritt ist freiwillig – ein Bereich reicht, um weiterzumachen.
        </AppText>
      </View>
    );
  }

  const total = phrases.filter((p) => p.category === category).length;
  const card = queue[0];

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.deckHead}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Zurück zu den Funktionen"
          onPress={() => {
            halt();
            setCategory(null);
          }}
        >
          <AppText color={colors.primaryDark} style={{ fontWeight: '700' }}>
            ‹ Funktionen
          </AppText>
        </Pressable>
        <AppText style={{ fontWeight: '700' }}>{labels[category]}</AppText>
        <AppText variant="small" color={colors.mutedForeground}>
          {known}/{total}
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(known / total) * 100}%` }]} />
      </View>

      {card ? (
        <>
          <Pop key={card.id + known}>
            <View style={styles.card}>
              <View style={styles.cardTop}>
                {card.formality ? (
                  <View style={styles.tag}>
                    <AppText variant="caption" color={colors.mutedForeground}>
                      {FORMALITY_LABELS[card.formality]}
                    </AppText>
                  </View>
                ) : (
                  <View />
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={speaking ? 'Vorlesen stoppen' : 'Redemittel anhören'}
                  onPress={() =>
                    say(card.example ? `${card.phrase}. ${card.example}` : card.phrase)
                  }
                  style={[styles.speak, speaking && { backgroundColor: WRITING_COLOR }]}
                >
                  <Ionicons
                    name={speaking ? 'stop' : 'volume-high'}
                    size={20}
                    color={speaking ? '#FFFFFF' : WRITING_COLOR}
                  />
                </Pressable>
              </View>
              <AppText style={styles.phrase}>{card.phrase}</AppText>
              {card.example ? (
                <AppText
                  style={{ fontStyle: 'italic', fontSize: 16, lineHeight: 24 }}
                  color={colors.mutedForeground}
                >
                  z. B. {card.example}
                </AppText>
              ) : null}
              {card.explanation ? (
                <AppText color={colors.mutedForeground}>{card.explanation}</AppText>
              ) : null}
              {card.usageNote ? (
                <AppText variant="small" color={colors.mutedForeground}>
                  Hinweis: {card.usageNote}
                </AppText>
              ) : null}
            </View>
          </Pop>
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button
                label="↻ Nochmal"
                variant="secondary"
                onPress={() => answer(false)}
                color={darken(WRITING_COLOR)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="✓ Kenne ich" onPress={() => answer(true)} color={WRITING_COLOR} />
            </View>
          </View>
        </>
      ) : (
        <Pop>
          <View
            style={[styles.card, { backgroundColor: colors.successSoft, alignItems: 'center' }]}
          >
            <AppText style={styles.prompt}>Geschafft! 🎉</AppText>
            <AppText center>
              Du kennst alle {total} Redemittel für „{labels[category]}“.
            </AppText>
            <Button
              label="Nächste Funktion wählen"
              onPress={() => setCategory(null)}
              color={WRITING_COLOR}
            />
          </View>
        </Pop>
      )}
    </View>
  );
}

/* ───────────────────────── DiscoverText ───────────────────────── */

/**
 * The model text split into its functional parts. The learner picks a part and sees that part's text,
 * why it works and matching phrases, one part at a time.
 */
export function DiscoverText({
  api,
  sections,
}: {
  api: StepApi;
  sections: WritingExampleSection[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set());
  const current = sections.find((s) => s.key === active);
  const allSeen = api.solved || seen.size === sections.length;

  const open = (key: string) => {
    setActive(key);
    buzz(8);
    const next = new Set(seen).add(key);
    setSeen(next);
    if (next.size === sections.length) api.complete();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: 4 }}>
        <Prompt>Entdecke den Text</Prompt>
        <AppText color={colors.mutedForeground}>
          Tippe auf jeden Teil und finde heraus, warum er funktioniert.
        </AppText>
      </View>
      <View style={styles.wrap} accessibilityRole="tablist">
        {sections.map((s) => {
          const isSeen = api.solved || seen.has(s.key);
          const on = active === s.key;
          return (
            <Pressable
              key={s.key}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              accessibilityState={{ selected: on }}
              onPress={() => open(s.key)}
              style={[
                styles.pill,
                on && { backgroundColor: WRITING_COLOR, borderColor: WRITING_COLOR },
                !on && isSeen && styles.optionRight,
              ]}
            >
              {isSeen && !on ? (
                <Ionicons name="checkmark" size={14} color={colors.success} />
              ) : null}
              <AppText
                variant="small"
                style={{ fontWeight: '700' }}
                color={on ? '#FFFFFF' : colors.foreground}
              >
                {s.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {current ? (
        <Pop key={current.key}>
          <View style={styles.card}>
            <View style={[styles.quote, { borderLeftWidth: 4, borderLeftColor: WRITING_COLOR }]}>
              <AppText style={{ fontSize: 16, lineHeight: 24 }}>{current.text}</AppText>
            </View>
            {current.why ? (
              <View style={{ gap: 2 }}>
                <AppText
                  variant="caption"
                  color={colors.mutedForeground}
                  style={{ fontWeight: '800' }}
                >
                  WARUM IST DAS WICHTIG?
                </AppText>
                <AppText>{current.why}</AppText>
              </View>
            ) : null}
            {current.phrases?.length ? (
              <View style={styles.wrap}>
                {current.phrases.map((p) => (
                  <View key={p} style={styles.tag}>
                    <AppText variant="small">{p}</AppText>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </Pop>
      ) : (
        <View style={styles.empty}>
          <AppText color={colors.mutedForeground}>Wähle oben einen Teil aus.</AppText>
        </View>
      )}
      <AppText variant="small" color={colors.mutedForeground} accessibilityLiveRegion="polite">
        {allSeen
          ? 'Alle Teile entdeckt – klasse! 🔍'
          : `${seen.size} von ${sections.length} entdeckt`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { fontSize: 20, lineHeight: 26, fontWeight: '800', color: colors.ink },
  quote: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.accent },
  option: {
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionRight: { borderColor: colors.success, backgroundColor: colors.successSoft },
  optionWrong: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
  box: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slots: {
    minHeight: 72,
    padding: spacing.sm,
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.accent,
  },
  col: { gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipBtn: {
    minHeight: MIN_TOUCH - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  num: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: { width: '48%', flexGrow: 1 },
  deckHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.muted, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: WRITING_COLOR },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: tint(WRITING_COLOR, '33'),
    backgroundColor: colors.surface,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  phrase: { fontSize: 22, lineHeight: 30, fontWeight: '800', color: colors.ink },
  speak: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tint(WRITING_COLOR, '1F'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
});
