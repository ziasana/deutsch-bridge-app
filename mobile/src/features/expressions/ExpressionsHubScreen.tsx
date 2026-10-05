import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Card, ErrorState, Header, Screen, Skeleton } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { ExpressionType } from '@/types/expression';
import { ExpressionRow } from './components/ExpressionRow';
import { useCollectionSummary, useContinueLearning } from './hooks';
import { TYPE_DESCRIPTION, TYPE_EMOJI, TYPE_LABEL } from './labels';

const TYPES: ExpressionType[] = ['REDEWENDUNG', 'NOMEN_VERB_VERBINDUNG'];

function CollectionCard({ type, total }: { type: ExpressionType; total: number | undefined }) {
  const router = useRouter();
  const cont = useContinueLearning(type);
  const ready = cont.data?.readyCount ?? 0;
  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <AppText style={{ fontSize: 32 }} accessibilityElementsHidden>
          {TYPE_EMOJI[type]}
        </AppText>
        <View style={{ flex: 1 }}>
          <AppText variant="heading">{TYPE_LABEL[type]}</AppText>
          <AppText color={colors.mutedForeground}>{TYPE_DESCRIPTION[type]}</AppText>
        </View>
      </View>
      <AppText variant="small" color={colors.mutedForeground}>
        {total === undefined ? '…' : `${total} Einträge`}
        {ready > 0 ? ` · ${ready} bereit zum Üben` : ''}
      </AppText>

      {cont.data && cont.data.items.length > 0 ? (
        <View>
          <AppText variant="caption" color={colors.primaryDark}>
            WEITER LERNEN
          </AppText>
          {cont.data.items.slice(0, 3).map((item) => (
            <ExpressionRow
              key={item.id}
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/expressions/[expressionId]',
                  params: { expressionId: item.id },
                })
              }
            />
          ))}
        </View>
      ) : null}

      <Button
        label={`${TYPE_LABEL[type]} ansehen`}
        variant="secondary"
        onPress={() => router.push({ pathname: '/expressions/list/[type]', params: { type } })}
      />
    </Card>
  );
}

export function ExpressionsHubScreen() {
  const router = useRouter();
  const summary = useCollectionSummary();
  const totalOf = (type: ExpressionType) => summary.data?.find((s) => s.type === type)?.total;

  return (
    <Screen>
      <Header
        title="Active Expressions"
        subtitle="Wendungen sicher im Alltag und in der Prüfung einsetzen"
        back
      />
      {summary.isPending ? (
        <View accessibilityLabel="Sammlungen werden geladen" style={{ gap: spacing.md }}>
          <Card style={{ gap: spacing.sm }}>
            <Skeleton width="60%" height={24} />
            <Skeleton height={16} />
          </Card>
        </View>
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
      ) : (
        <>
          <Card tone="accent" style={{ gap: spacing.sm }}>
            <AppText variant="subheading">🎯 Training</AppText>
            <AppText color={colors.mutedForeground}>
              Üben mit Lücken, Kontextfragen und eigenen Sätzen. Fällige Wendungen kommen zuerst.
            </AppText>
            <Button label="Training starten" onPress={() => router.push('/expressions/practice')} />
          </Card>
          {TYPES.map((type) => (
            <CollectionCard key={type} type={type} total={totalOf(type)} />
          ))}
        </>
      )}
    </Screen>
  );
}
