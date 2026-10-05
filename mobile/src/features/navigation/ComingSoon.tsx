import { EmptyState, Header, Screen } from '@/components/ui';

type Props = { title: string; subtitle?: string; back?: boolean; emoji?: string };

/** Placeholder for destinations that land in later phases; keeps navigation fully walkable. */
export function ComingSoon({ title, subtitle, back = true, emoji = '🛠️' }: Props) {
  return (
    <Screen bottomInset={back}>
      <Header title={title} subtitle={subtitle} back={back} />
      <EmptyState
        emoji={emoji}
        title="Bald verfügbar"
        message="Dieser Bereich wird in Kürze freigeschaltet."
      />
    </Screen>
  );
}
