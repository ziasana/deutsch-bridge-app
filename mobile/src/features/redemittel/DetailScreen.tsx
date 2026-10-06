import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText, ErrorState, Header, Screen, Skeleton } from '@/components/ui';
import { IconButton } from '@/features/exam/components/kit';
import { colors, spacing } from '@/theme';
import { DetailCard } from './components/DetailCard';
import { RedemittelHero } from './components/RedemittelViz';
import { useRedemittel, useToggleSave } from './hooks';
import { STATUS_LABELS } from './meta';

export function RedemittelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useRedemittel(id);
  const toggle = useToggleSave();
  const r = query.data;

  if (query.isPending) {
    return (
      <Screen>
        <Header title="Redemittel" back />
        <View accessibilityLabel="Redemittel wird geladen" style={{ gap: spacing.md }}>
          <Skeleton height={36} />
          <Skeleton height={240} />
        </View>
      </Screen>
    );
  }
  if (query.isError || !r) {
    return (
      <Screen>
        <Header title="Redemittel" back />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <RedemittelHero
          chip={`🗣️ ${r.categoryLabel.toUpperCase()}`}
          title="Redemittel"
          subtitle={`${r.level} · ${STATUS_LABELS[r.status]}`}
          trailing={
            <IconButton
              name={r.saved ? 'star' : 'star-outline'}
              label={r.saved ? 'Aus meiner Sammlung entfernen' : 'Zu meinen Redemitteln hinzufügen'}
              color={r.saved ? colors.warning : colors.ink}
              busy={toggle.isPending}
              onPress={() => toggle.mutate(r)}
            />
          }
        />
        <View style={styles.body}>
          <DetailCard
            redemittel={r}
            saving={toggle.isPending}
            onToggleSave={(x) => toggle.mutate(x)}
          />
          {toggle.error ? (
            <AppText color={colors.destructive} accessibilityRole="alert">
              {toggle.error.message}
            </AppText>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  body: { padding: spacing.lg, gap: spacing.lg },
});
