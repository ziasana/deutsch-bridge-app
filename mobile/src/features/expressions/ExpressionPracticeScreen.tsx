import { useLocalSearchParams, useRouter } from 'expo-router';
import { useReducer, useState } from 'react';
import { View } from 'react-native';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LearningCelebration,
  ProgressBar,
  Screen,
  Skeleton,
} from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import { resultTitle } from '@/utils/feedback';
import {
  DiscoverStep,
  McqStep,
  ProductionStep,
  RecallStep,
  TransformationSentenceStep,
} from './components/PracticeSteps';
import { usePracticeSession } from './hooks';
import { TYPE_SINGULAR } from './labels';
import {
  computeSteps,
  initialPractice,
  practiceReducer,
  questionForStep,
  summarize,
} from './practiceLogic';

export function ExpressionPracticeScreen() {
  const router = useRouter();
  const { expressionId, skipIntro } = useLocalSearchParams<{
    expressionId?: string;
    skipIntro?: string;
  }>();
  const persian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const session = usePracticeSession(expressionId);
  const [state, dispatch] = useReducer(practiceReducer, initialPractice);
  // Practising one specific expression starts right away; a general session shows its size first.
  const [started, setStarted] = useState(!!expressionId);
  const skip = skipIntro === '1';

  const items = session.data?.items ?? [];
  const item = items[state.itemIndex];
  const goBack = () => router.back();

  let body;
  if (session.isPending) {
    body = (
      <View accessibilityLabel="Training wird geladen" style={{ gap: spacing.md }}>
        <Skeleton height={8} />
        <Card style={{ gap: spacing.md }}>
          <Skeleton width="60%" height={32} />
          <Skeleton height={48} />
        </Card>
      </View>
    );
  } else if (session.isError) {
    body = <ErrorState error={session.error} onRetry={() => void session.refetch()} />;
  } else if (items.length === 0) {
    body = (
      <EmptyState
        emoji="🎉"
        title="Alles erledigt!"
        message="Keine Wendungen sind gerade fällig. Schau später wieder vorbei."
        actionLabel="Zurück"
        onAction={goBack}
      />
    );
  } else if (!started) {
    const { newCount, reviewCount } = session.data!;
    body = (
      <Card tone="accent" style={{ gap: spacing.md, padding: spacing.xl }}>
        <AppText variant="heading">{items.length} Wendungen bereit</AppText>
        <AppText color={colors.mutedForeground}>
          {newCount} neu · {reviewCount} zur Wiederholung
        </AppText>
        <AppText color={colors.mutedForeground}>
          Zu jeder Wendung: Bedeutung entdecken, Lücken füllen, Kontext erkennen und einen eigenen
          Satz schreiben.
        </AppText>
        <Button label="Training starten" onPress={() => setStarted(true)} />
      </Card>
    );
  } else if (state.done) {
    const s = summarize(state.results);
    body = (
      <View style={{ gap: spacing.md }}>
        <LearningCelebration
          title={resultTitle(s.correct, s.total)}
          subtitle={`Wendungen geübt: ${s.expressions}`}
          progress={{ value: s.correct, max: Math.max(s.total, 1) }}
          progressLabel={`${s.correct} von ${s.total} Antworten richtig (${s.percent}%)`}
          encouragement={
            s.productionTotal > 0
              ? `Eigene Sätze: ${s.productionCorrect} von ${s.productionTotal} gelungen`
              : undefined
          }
          primaryAction={{ label: 'Fertig', onPress: goBack }}
        />
        {s.strong.length > 0 ? (
          <Card style={{ gap: 2 }}>
            <AppText variant="subheading" color="#1B7A55">
              ✓ Stark
            </AppText>
            <AppText>{s.strong.join(', ')}</AppText>
          </Card>
        ) : null}
        {s.needsPractice.length > 0 ? (
          <Card style={{ gap: 2 }}>
            <AppText variant="subheading">Noch üben</AppText>
            <AppText>{s.needsPractice.join(', ')}</AppText>
          </Card>
        ) : null}
      </View>
    );
  } else if (item) {
    const steps = computeSteps(item, skip);
    const step = steps[state.stepIndex];
    const isLastStep = state.stepIndex + 1 >= steps.length;
    const finish = (outcome: boolean | null) =>
      dispatch({
        type: 'STEP_DONE',
        outcome,
        stepCount: steps.length,
        itemCount: items.length,
        expression: item.expression,
        isProduction: step === 'production',
      });
    const question = questionForStep(item, step);

    let stepView = null;
    if (step === 'discover')
      stepView = <DiscoverStep item={item} persian={persian} onDone={finish} />;
    else if (step === 'recall')
      stepView = <RecallStep item={item} isLast={isLastStep} onDone={finish} />;
    else if ((step === 'context' || step === 'completion') && question)
      stepView = <McqStep item={item} question={question} intro={step} onDone={finish} />;
    else if (step === 'transformation' && question)
      stepView =
        question.format === 'FREE_TEXT' ? (
          <TransformationSentenceStep item={item} question={question} onDone={finish} />
        ) : (
          <McqStep item={item} question={question} intro="transformation" onDone={finish} />
        );
    else if (step === 'production')
      stepView = (
        <ProductionStep
          item={item}
          isLastItem={state.itemIndex + 1 >= items.length}
          onDone={finish}
        />
      );
    else stepView = <Button label="Weiter" onPress={() => finish(null)} />; // a step without a question never blocks

    body = (
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: spacing.sm }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <AppText variant="subheading">
              {state.itemIndex + 1} / {items.length}
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Badge tone="primary" label={item.level} />
              <Badge label={TYPE_SINGULAR[item.type]} />
            </View>
          </View>
          <ProgressBar
            value={state.stepIndex}
            max={steps.length}
            label={`Schritt ${state.stepIndex + 1} von ${steps.length}`}
          />
        </View>
        {/* Keyed per expression and step, so each step starts with fresh input/result state. */}
        <View key={`${state.itemIndex}:${step}`}>{stepView}</View>
      </View>
    );
  }

  return (
    <Screen keyboardAware>
      <Header title="Training" subtitle="Active Expressions" back />
      {body}
    </Screen>
  );
}
