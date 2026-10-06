import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, EmptyState, ErrorState, ProgressBar, Skeleton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { DetailCard } from './components/DetailCard';
import { PhraseIllustration, RedemittelHero } from './components/RedemittelViz';
import { useLearnRedemittel, useTodayRedemittel, useToggleSave } from './hooks';
import { REDEMITTEL_COLOR } from './meta';

/** Today's new Redemittel, one card at a time: read it, then "Verstanden" marks it learned. */
export function RedemittelLearnScreen() {
  const router = useRouter();
  const today = useTodayRedemittel();
  const learn = useLearnRedemittel();
  const toggle = useToggleSave();
  const [index, setIndex] = useState(0);
  const [learnedIds, setLearnedIds] = useState<string[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const list = today.data ?? [];
  const home = () => router.navigate('/learn/redemittel');
  const current = list[index];
  const isLast = index === list.length - 1;

  let body;
  if (today.isPending) {
    body = (
      <View accessibilityLabel="Redemittel werden geladen" style={{ gap: spacing.md }}>
        <Skeleton height={8} />
        <Skeleton height={260} />
      </View>
    );
  } else if (today.isError) {
    body = <ErrorState error={today.error} onRetry={() => void today.refetch()} />;
  } else if (list.length === 0) {
    body = (
      <EmptyState
        emoji="🎉"
        title="Alles gelernt für heute"
        message="Schau später wieder vorbei oder übe deine bisherigen Redemittel."
        actionLabel="Üben"
        onAction={() => router.replace('/redemittel/practice')}
      />
    );
  } else if (index >= list.length) {
    body = (
      <View style={styles.done}>
        <AppText style={{ fontSize: 48, lineHeight: 56 }}>🎉</AppText>
        <AppText style={styles.doneTitle}>Gut gemacht!</AppText>
        <AppText center color={colors.ink}>
          Du hast heute {learnedIds.length} Redemittel gelernt.
        </AppText>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            pill
            label="Jetzt üben"
            onPress={() =>
              router.replace({
                pathname: '/redemittel/practice',
                params: { ids: learnedIds.join(',') },
              })
            }
          />
          <Button pill variant="secondary" label="Später wiederholen" onPress={home} />
        </View>
        <AppText variant="small" center color={colors.mutedForeground}>
          Die erste Wiederholung ist automatisch für morgen geplant.
        </AppText>
      </View>
    );
  } else if (current) {
    const view = { ...current, saved: saved[current.id] ?? current.saved };
    body = (
      <>
        <View style={{ gap: spacing.xs }}>
          <AppText variant="small" color={colors.mutedForeground}>
            Redemittel {index + 1} von {list.length}
          </AppText>
          <ProgressBar
            value={(index / list.length) * 100}
            label={`${index} von ${list.length} gelernt`}
            color={REDEMITTEL_COLOR}
          />
        </View>
        <DetailCard
          key={current.id}
          redemittel={view}
          saving={toggle.isPending}
          onToggleSave={(r) =>
            toggle.mutate(r, { onSuccess: (u) => setSaved((p) => ({ ...p, [u.id]: u.saved })) })
          }
        >
          <Button
            pill
            label={isLast ? 'Verstanden – abschließen' : 'Verstanden – weiter'}
            loading={learn.isPending}
            onPress={() =>
              learn.mutate(current, {
                onSuccess: () => {
                  setLearnedIds((p) => [...p, current.id]);
                  setIndex((i) => i + 1);
                },
              })
            }
          />
        </DetailCard>
        {learn.error ? (
          <AppText color={colors.destructive} accessibilityRole="alert">
            {learn.error.message}
          </AppText>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <RedemittelHero
          chip="🌱 HEUTE LERNEN"
          title="Neue Redemittel"
          subtitle="Lies, verstehe und merke dir die Wendungen."
          right={<PhraseIllustration size={92} />}
        />
        <View style={styles.body}>{body}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.lg },
  done: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
  },
  doneTitle: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: colors.ink },
});
