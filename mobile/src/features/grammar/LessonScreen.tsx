import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import { RichContent } from '@/components/content/RichContent';
import {
  AppText,
  Badge,
  Button,
  Card,
  ErrorState,
  Header,
  Screen,
  Skeleton,
} from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import { useLesson, useLessonNavigation, useSetLessonLearned, useToggleBookmark } from './hooks';
import {
  isLessonLearned,
  isTranslatableLevel,
  lessonQuestions,
  localizedHeading,
  localizedLesson,
} from './quiz';

function LessonSkeleton() {
  return (
    <View accessibilityLabel="Lektion wird geladen" style={{ gap: spacing.md }}>
      <Skeleton width="70%" height={32} />
      <Skeleton height={16} />
      <Card style={{ gap: spacing.sm }}>
        <Skeleton height={16} />
        <Skeleton height={16} />
        <Skeleton width="80%" height={16} />
      </Card>
    </View>
  );
}

export function LessonScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const persian = useAuthStore((s) => s.profile?.preferredLanguage === 'PR');
  const lessonQuery = useLesson(lessonId);
  const navigation = useLessonNavigation(lessonId);
  const learnedMutation = useSetLessonLearned(lessonId);
  const bookmarkMutation = useToggleBookmark(lessonId);

  const goTo = (id: string) =>
    router.replace({ pathname: '/grammar/[lessonId]', params: { lessonId: id } });
  const lesson = lessonQuery.data;

  if (lessonQuery.isPending) {
    return (
      <Screen>
        <Header title="Lektion" back />
        <LessonSkeleton />
      </Screen>
    );
  }
  if (lessonQuery.isError || !lesson) {
    return (
      <Screen>
        <Header title="Lektion" back />
        <ErrorState error={lessonQuery.error} onRetry={() => void lessonQuery.refetch()} />
      </Screen>
    );
  }

  const text = localizedLesson(lesson, persian);
  const learned = isLessonLearned(lesson);
  const quizCount = lessonQuestions(lesson).length;
  const dir = text.dir;
  const prev = navigation.data?.previous;
  const next = navigation.data?.next;
  const mutationError = learnedMutation.error ?? bookmarkMutation.error;

  const neighborNav = (prev || next) && (
    <View style={styles.navRow} accessibilityRole="toolbar">
      <View style={styles.flex}>
        {prev ? (
          <Button
            label="‹ Vorherige"
            variant="secondary"
            onPress={() => goTo(prev.id)}
            accessibilityHint={
              localizedHeading({ ...prev, summary: '', summaryFa: null }, persian).title
            }
          />
        ) : null}
      </View>
      <View style={styles.flex}>
        {next ? (
          <Button
            label="Nächste ›"
            variant="secondary"
            onPress={() => goTo(next.id)}
            accessibilityHint={
              localizedHeading({ ...next, summary: '', summaryFa: null }, persian).title
            }
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen>
      <Header title={text.title} subtitle={text.summary} back />
      <View style={styles.meta}>
        <Badge tone="primary" label={lesson.level} />
        {learned ? <Badge tone="success" label="✓ Gelernt" /> : null}
        {persian && !isTranslatableLevel(lesson.level) ? <Badge label="Nur auf Deutsch" /> : null}
      </View>

      <Button
        label={lesson.bookmarked ? '★ Gemerkt – entfernen' : '☆ Für später merken'}
        variant="secondary"
        loading={bookmarkMutation.isPending}
        onPress={() => bookmarkMutation.mutate(lesson.bookmarked)}
        accessibilityHint="Speichert die Lektion in deiner Merkliste"
      />

      {neighborNav}

      <Card style={{ gap: spacing.md }}>
        <RichContent content={text.content} dir={dir} />
      </Card>

      {lesson.videoLink ? (
        <Button
          label="▶ Video ansehen"
          variant="secondary"
          onPress={() => void Linking.openURL(lesson.videoLink!)}
        />
      ) : null}

      {text.example ? (
        <Card tone="accent" style={{ gap: spacing.sm }}>
          <AppText variant="subheading">💬 Beispiel</AppText>
          <RichContent content={text.example} dir={dir} />
        </Card>
      ) : null}

      {text.usageTips ? (
        <Card style={{ gap: spacing.sm, borderColor: colors.warning }}>
          <AppText variant="subheading">💡 Tipp</AppText>
          <RichContent content={text.usageTips} dir={dir} />
        </Card>
      ) : null}

      {mutationError ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {mutationError.message}
        </AppText>
      ) : null}

      <Button
        label={learned ? '✓ Gelernt – zurücksetzen' : 'Als gelernt markieren'}
        variant={learned ? 'secondary' : 'primary'}
        loading={learnedMutation.isPending}
        onPress={() => learnedMutation.mutate(!learned)}
      />

      {quizCount > 0 ? (
        <Card tone="accent" style={{ gap: spacing.sm }}>
          <AppText variant="subheading">🏋️ Übungen</AppText>
          <AppText color={colors.mutedForeground}>{quizCount} Fragen zu dieser Lektion</AppText>
          <Button
            label="Übungen starten"
            onPress={() =>
              router.push({
                pathname: '/grammar/practice/[lessonId]',
                params: { lessonId: lesson.id },
              })
            }
          />
        </Card>
      ) : null}

      {neighborNav}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  navRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
});
