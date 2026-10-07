import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Chip, ConfirmSheet, DirectionalIcon, TextField } from '@/components/ui';
import { useI18n } from '@/i18n';
import { router } from 'expo-router';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';
import { ChoiceCard } from './ChoiceCard';
import { useCompleteOnboarding } from './hooks';
import { OnboardingComplete } from './OnboardingComplete';
import { buildOptions } from './options';
import {
  MAX_FOCUS,
  examDateProblem,
  isStepValid,
  isTargetAllowed,
  stepsFor,
  toRequest,
  type PlanState,
  type StepId,
} from './plan';
import { useOnboardingStore } from './store';

type IconName = ComponentProps<typeof Ionicons>['name'];

const STEP_ICONS: Record<StepId, IconName> = {
  language: 'language-outline',
  reason: 'compass-outline',
  currentLevel: 'bar-chart-outline',
  targetLevel: 'flag-outline',
  dailyWords: 'locate-outline',
  focus: 'sparkles-outline',
  exam: 'school-outline',
};

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

/** One thin bar segment per step, filled up to the current one. */
function SegmentedProgress({ index, total }: { index: number; total: number }) {
  const { t } = useI18n();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t.entry.onboarding.setup}
      accessibilityValue={{
        min: 1,
        max: total,
        now: index + 1,
        text: t.entry.onboarding.step(index + 1, total),
      }}
      style={styles.segments}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.segment, i <= index && styles.segmentOn]} />
      ))}
    </View>
  );
}

function StepBody({ step }: { step: StepId }) {
  const plan = useOnboardingStore();
  const { t } = useI18n();
  const ob = t.entry.onboarding;
  const opts = useMemo(() => buildOptions(ob), [ob]);
  const { patch, toggleReason, toggleFocus } = plan;
  const [showGuide, setShowGuide] = useState(false);

  switch (step) {
    case 'language':
      return (
        <>
          {opts.languages.map((o) => (
            <ChoiceCard
              key={o.value}
              option={o}
              selected={plan.language === o.value}
              onPress={() => patch({ language: o.value })}
            />
          ))}
          <AppText variant="caption" color={colors.mutedForeground}>
            {ob.languageNote}
          </AppText>
        </>
      );
    case 'reason':
      return (
        <>
          {opts.reasons.map((o) => (
            <ChoiceCard
              multi
              key={o.value}
              option={o}
              selected={plan.reasons.includes(o.value)}
              onPress={() => toggleReason(o.value)}
            />
          ))}
        </>
      );
    case 'currentLevel':
      return (
        <>
          {opts.levels.map((o) => (
            <ChoiceCard
              key={o.value}
              option={{ ...o, description: undefined }}
              selected={!plan.currentLevelUnknown && plan.currentLevel === o.value}
              onPress={() => patch({ currentLevel: o.value, currentLevelUnknown: false })}
            />
          ))}
          <ChoiceCard
            option={{
              value: 'unknown',
              label: ob.notSure.label,
              description: ob.notSure.description,
            }}
            selected={plan.currentLevelUnknown}
            onPress={() => patch({ currentLevel: null, currentLevelUnknown: true })}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowGuide((v) => !v)}
            style={styles.linkBtn}
          >
            <AppText variant="small" color={colors.primaryDark}>
              {ob.notSureLink}
            </AppText>
          </Pressable>
          {showGuide ? (
            <View style={styles.guide}>
              {opts.levels.map((o) => (
                <AppText key={o.value} variant="small" color={colors.mutedForeground}>
                  <AppText variant="small" style={styles.bold}>
                    {o.value}
                  </AppText>{' '}
                  – {o.description}
                </AppText>
              ))}
            </View>
          ) : null}
        </>
      );
    case 'targetLevel':
      return (
        <>
          {opts.levels.map((o) => (
            <ChoiceCard
              key={o.value}
              option={{ ...o, description: undefined }}
              selected={plan.targetLevel === o.value}
              disabled={!isTargetAllowed(o.value, plan)}
              onPress={() => patch({ targetLevel: o.value })}
            />
          ))}
          {!plan.currentLevelUnknown && plan.currentLevel ? (
            <AppText variant="caption" color={colors.mutedForeground}>
              {ob.targetNote(plan.currentLevel)}
            </AppText>
          ) : null}
        </>
      );
    case 'dailyWords':
      return (
        <View style={styles.grid}>
          {opts.dailyWords.map((o) => {
            const on = plan.dailyWords === o.value;
            return (
              <Pressable
                key={o.value}
                accessibilityRole="radio"
                accessibilityLabel={ob.wordsPerDayLabel(o.value, o.description ?? '')}
                accessibilityState={{ checked: on }}
                onPress={() => patch({ dailyWords: o.value })}
                style={[styles.tile, on && styles.tileOn]}
              >
                <AppText style={[styles.tileNumber, on && { color: colors.primaryDark }]}>
                  {o.value}
                </AppText>
                <AppText variant="small" color={colors.mutedForeground}>
                  {ob.wordsPerDay}
                </AppText>
                <AppText variant="caption" color={on ? colors.primaryDark : colors.mutedForeground}>
                  {o.description}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      );
    case 'focus': {
      const full = plan.focus.length >= MAX_FOCUS;
      return (
        <>
          {opts.focus.map((o) => {
            const on = plan.focus.includes(o.value);
            return (
              <ChoiceCard
                multi
                key={o.value}
                option={o}
                selected={on}
                disabled={full && !on}
                onPress={() => toggleFocus(o.value)}
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
            {opts.exams.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={plan.examType === o.value}
                onPress={() => patch({ examType: o.value })}
              />
            ))}
          </View>
          <AppText variant="subheading" color={colors.ink}>
            {ob.examLevelQ}
          </AppText>
          <View style={styles.chips}>
            {opts.levels.map((o) => (
              <Chip
                key={o.value}
                label={o.value}
                selected={plan.examLevel === o.value}
                onPress={() => patch({ examLevel: o.value })}
              />
            ))}
          </View>
          <AppText variant="subheading" color={colors.ink}>
            {ob.examDateQ}
          </AppText>
          <ChoiceCard
            option={{ value: false, label: ob.notYet }}
            selected={!plan.hasExamDate}
            onPress={() => patch({ hasExamDate: false })}
          />
          <ChoiceCard
            option={{ value: true, label: ob.yes }}
            selected={plan.hasExamDate}
            onPress={() => patch({ hasExamDate: true })}
          />
          {plan.hasExamDate ? (
            <TextField
              pill
              hideLabel
              label={ob.examDate}
              placeholder={ob.examDatePlaceholder}
              keyboardType="numbers-and-punctuation"
              value={plan.examDateText}
              onChangeText={(t) => patch({ examDateText: t })}
              error={
                plan.examDateText && problem
                  ? problem === 'format'
                    ? ob.dateFormat
                    : ob.datePast
                  : undefined
              }
            />
          ) : null}
        </View>
      );
    }
  }
}

/**
 * Learning-plan setup right after sign-up — same steps, rules and persistence as the web wizard:
 * language → reasons → current level → target level → daily words → focus → (exam details).
 */
export function OnboardingScreen() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const signOut = useAuthStore((s) => s.signOut);
  const store = useOnboardingStore();
  const { t } = useI18n();
  const ob = t.entry.onboarding;
  const complete = useCompleteOnboarding();
  const [saved, setSaved] = useState<UserProfile | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { hydrated, ensureOwner } = store;

  // Stored answers belong to one account; another account (or a fresh sign-up) starts clean.
  useEffect(() => {
    if (hydrated) ensureOwner(profile?.email);
  }, [hydrated, profile?.email, ensureOwner]);

  if (!hydrated || store.ownerEmail !== (profile?.email ?? null))
    return <View style={styles.root} />;

  const steps = stepsFor(store);
  const index = Math.max(0, steps.indexOf(store.step));
  const step = steps[index];
  const last = index === steps.length - 1;
  const valid = isStepValid(step, store);

  if (saved) {
    return (
      <OnboardingComplete
        targetLevel={store.targetLevel ?? ''}
        focus={store.focus}
        dailyWords={store.dailyWords ?? 5}
        onStart={() => {
          store.reset();
          if (env.onboardingPreview) router.replace('/welcome');
          else setProfile(saved); // flips onboardingCompleted → the route guard opens the app
        }}
      />
    );
  }

  const next = () => {
    if (!valid) return;
    if (!last) store.setStep(steps[index + 1]);
    else if (env.onboardingPreview)
      setSaved({} as UserProfile); // preview: show the summary, save nothing
    else complete.mutate(toRequest(store as PlanState), { onSuccess: setSaved });
  };

  const confirmSignOut = () => setSignOutOpen(true);

  const stepCopy = ob.steps[step];
  const subtitle =
    step === 'focus' ? ob.steps.focus.subtitle(MAX_FOCUS) : (stepCopy.subtitle as string);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.top}>
        {index > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.entry.common.back}
            onPress={() => store.setStep(steps[index - 1])}
            hitSlop={8}
            style={styles.back}
          >
            <DirectionalIcon name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
        ) : env.onboardingPreview ? (
          <View style={styles.signOut} />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ob.signOut}
            onPress={confirmSignOut}
            hitSlop={8}
            style={styles.signOut}
          >
            <AppText variant="small" color={colors.mutedForeground}>
              {ob.signOut}
            </AppText>
          </Pressable>
        )}
        <View style={styles.progress}>
          <SegmentedProgress index={index} total={steps.length} />
        </View>
        <AppText variant="caption" color={colors.primaryDark} style={styles.stepPill}>
          {ob.step(index + 1, steps.length)}
        </AppText>
      </View>

      <ConfirmSheet
        visible={signOutOpen}
        destructive
        title={ob.signOutTitle}
        message={ob.signOutMessage}
        confirmLabel={ob.signOut}
        onConfirm={() => {
          setSignOutOpen(false);
          void signOut();
        }}
        onCancel={() => setSignOutOpen(false)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FadeIn id={step}>
          <View style={styles.body}>
            {index === 0 ? (
              <View style={styles.banner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <AppText variant="small" color={colors.primaryDark} style={styles.bannerText}>
                  {ob.banner}
                </AppText>
              </View>
            ) : null}
            <View style={styles.heading}>
              <View style={styles.headIcon}>
                <Ionicons name={STEP_ICONS[step]} size={26} color="#FFFFFF" />
              </View>
              <AppText style={styles.title} accessibilityRole="header">
                {stepCopy.title}
              </AppText>
              <AppText color={colors.mutedForeground}>{subtitle}</AppText>
            </View>
            <StepBody step={step} />
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
          label={last ? ob.done : t.entry.common.next}
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
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.border },
  segmentOn: { backgroundColor: colors.primary },
  stepPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    overflow: 'hidden',
    fontWeight: '700',
  },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  body: { gap: spacing.md },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerText: { flex: 1, fontWeight: '600' },
  heading: { gap: spacing.sm, marginBottom: spacing.sm },
  headIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', color: colors.ink },
  bold: { fontWeight: '700', color: colors.ink },
  linkBtn: { minHeight: MIN_TOUCH - 8, justifyContent: 'center' },
  guide: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    gap: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tileOn: { borderColor: colors.primaryDark, backgroundColor: colors.accent },
  tileNumber: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: colors.ink },
  examGroup: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
