import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Chip, ProgressBar, TextField } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { ChoiceCard } from './ChoiceCard';
import { useCompleteOnboarding } from './hooks';
import {
  DAILY_WORD_OPTIONS,
  EXAM_OPTIONS,
  FOCUS_OPTIONS,
  LANGUAGE_OPTIONS,
  LEVEL_OPTIONS,
  REASON_OPTIONS,
} from './options';
import {
  MAX_FOCUS,
  examDateProblem,
  initialPlan,
  isStepValid,
  stepsFor,
  toRequest,
  type PlanState,
  type StepId,
} from './plan';

const TITLES: Record<StepId, { title: string; subtitle?: string }> = {
  language: {
    title: 'In welcher Sprache erklären wir dir Dinge?',
    subtitle: 'Du kannst das später in den Einstellungen ändern.',
  },
  reason: { title: 'Warum lernst du Deutsch?', subtitle: 'Wähle alles, was passt.' },
  currentLevel: { title: 'Wie gut ist dein Deutsch heute?' },
  targetLevel: { title: 'Welches Niveau möchtest du erreichen?' },
  dailyWords: { title: 'Wie viele Wörter möchtest du pro Tag lernen?' },
  focus: {
    title: 'Worauf möchtest du dich konzentrieren?',
    subtitle: `Wähle bis zu ${MAX_FOCUS} Bereiche.`,
  },
  exam: { title: 'Auf welche Prüfung bereitest du dich vor?' },
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FadeIn({ id, children }: { id: string; children: ReactNode }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 240, useNativeDriver: true }).start();
  }, [v, id]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function StepBody({
  step,
  plan,
  set,
}: {
  step: StepId;
  plan: PlanState;
  set: (p: Partial<PlanState>) => void;
}) {
  switch (step) {
    case 'language':
      return (
        <>
          {LANGUAGE_OPTIONS.map((o) => (
            <ChoiceCard
              key={o.value}
              option={o}
              selected={plan.language === o.value}
              onPress={() => set({ language: o.value })}
            />
          ))}
        </>
      );
    case 'reason':
      return (
        <>
          {REASON_OPTIONS.map((o) => (
            <ChoiceCard
              multi
              key={o.value}
              option={o}
              selected={plan.reasons.includes(o.value)}
              onPress={() => set({ reasons: toggle(plan.reasons, o.value) })}
            />
          ))}
        </>
      );
    case 'currentLevel':
      return (
        <>
          {LEVEL_OPTIONS.map((o) => (
            <ChoiceCard
              key={o.value}
              option={o}
              selected={!plan.currentLevelUnknown && plan.currentLevel === o.value}
              onPress={() => set({ currentLevel: o.value, currentLevelUnknown: false })}
            />
          ))}
          <ChoiceCard
            option={{
              value: 'unknown',
              label: 'Ich weiß es nicht',
              description: 'Wir starten ganz entspannt für dich.',
              icon: 'help-circle-outline',
            }}
            selected={plan.currentLevelUnknown}
            onPress={() => set({ currentLevel: null, currentLevelUnknown: true })}
          />
        </>
      );
    case 'targetLevel':
      return (
        <>
          {LEVEL_OPTIONS.map((o) => (
            <ChoiceCard
              key={o.value}
              option={o}
              selected={plan.targetLevel === o.value}
              onPress={() => set({ targetLevel: o.value })}
            />
          ))}
        </>
      );
    case 'dailyWords':
      return (
        <>
          {DAILY_WORD_OPTIONS.map((o) => (
            <ChoiceCard
              key={o.value}
              option={o}
              selected={plan.dailyWords === o.value}
              onPress={() => set({ dailyWords: o.value })}
            />
          ))}
        </>
      );
    case 'focus': {
      const full = plan.focus.length >= MAX_FOCUS;
      return (
        <>
          {FOCUS_OPTIONS.map((o) => {
            const on = plan.focus.includes(o.value);
            return (
              <ChoiceCard
                multi
                key={o.value}
                option={o}
                selected={on}
                disabled={full && !on}
                onPress={() => set({ focus: toggle(plan.focus, o.value) })}
              />
            );
          })}
        </>
      );
    }
    case 'exam': {
      const problem = examDateProblem(plan);
      return (
        <View style={styles.examGroup}>
          <View style={styles.chips}>
            {EXAM_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={plan.examType === o.value}
                onPress={() => set({ examType: o.value })}
              />
            ))}
          </View>
          <AppText variant="subheading" color={colors.ink}>
            Für welches Niveau?
          </AppText>
          <View style={styles.chips}>
            {LEVEL_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.value}
                selected={plan.examLevel === o.value}
                onPress={() => set({ examLevel: o.value })}
              />
            ))}
          </View>
          <AppText variant="subheading" color={colors.ink}>
            Hast du schon einen Prüfungstermin?
          </AppText>
          <ChoiceCard
            option={{ value: false, label: 'Noch nicht' }}
            selected={!plan.hasExamDate}
            onPress={() => set({ hasExamDate: false })}
          />
          <ChoiceCard
            option={{ value: true, label: 'Ja' }}
            selected={plan.hasExamDate}
            onPress={() => set({ hasExamDate: true })}
          />
          {plan.hasExamDate ? (
            <TextField
              pill
              hideLabel
              label="Prüfungstermin"
              placeholder="TT.MM.JJJJ"
              keyboardType="numbers-and-punctuation"
              value={plan.examDateText}
              onChangeText={(t) => set({ examDateText: t })}
              error={plan.examDateText ? (problem ?? undefined) : undefined}
            />
          ) : null}
        </View>
      );
    }
  }
}

/** Learning-plan setup shown right after sign-up: one question per screen, then the app opens. */
export function OnboardingScreen() {
  const [plan, setPlan] = useState<PlanState>(initialPlan);
  const [index, setIndex] = useState(0);
  const complete = useCompleteOnboarding();
  const signOut = useAuthStore((s) => s.signOut);

  const steps = stepsFor(plan);
  const step = steps[Math.min(index, steps.length - 1)];
  const last = index >= steps.length - 1;
  const valid = isStepValid(step, plan);
  const set = (patch: Partial<PlanState>) => setPlan((p) => ({ ...p, ...patch }));

  const next = () => {
    if (!valid) return;
    if (!last) setIndex(index + 1);
    else complete.mutate(toRequest(plan));
  };

  const confirmSignOut = () =>
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: () => void signOut() },
    ]);

  const { title, subtitle } = TITLES[step];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.top}>
        {index > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zurück"
            onPress={() => setIndex(index - 1)}
            hitSlop={8}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abmelden"
            onPress={confirmSignOut}
            hitSlop={8}
            style={styles.signOut}
          >
            <AppText variant="small" color={colors.mutedForeground}>
              Abmelden
            </AppText>
          </Pressable>
        )}
        <View style={styles.progress}>
          <ProgressBar value={index + 1} max={steps.length} label="Einrichtung" />
        </View>
        <AppText variant="caption" color={colors.mutedForeground}>
          {index + 1}/{steps.length}
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FadeIn id={step}>
          <View style={styles.body}>
            <View style={styles.heading}>
              <AppText style={styles.title} accessibilityRole="header">
                {title}
              </AppText>
              {subtitle ? <AppText color={colors.mutedForeground}>{subtitle}</AppText> : null}
            </View>
            <StepBody step={step} plan={plan} set={set} />
          </View>
        </FadeIn>
      </ScrollView>

      <View style={styles.footer}>
        {complete.error ? (
          <AppText color={colors.destructive} accessibilityRole="alert" center>
            {complete.error.message}
          </AppText>
        ) : null}
        <Button
          pill
          label={last ? 'Lernplan starten' : 'Weiter'}
          disabled={!valid}
          loading={complete.isPending}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  back: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D2433',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  signOut: { minHeight: MIN_TOUCH, justifyContent: 'center' },
  progress: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  body: { gap: spacing.md },
  heading: { gap: spacing.xs, marginBottom: spacing.sm },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.ink },
  examGroup: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
