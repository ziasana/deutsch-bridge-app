import { Header, Screen } from '@/components/ui';
import { DestinationList } from '@/features/navigation/DestinationList';
import { LEARN_DESTINATIONS } from '@/features/navigation/destinations';

export default function LearnTab() {
  return (
    <Screen bottomInset={false}>
      <Header title="Learn" subtitle="Was möchtest du heute üben?" />
      <DestinationList items={LEARN_DESTINATIONS} />
    </Screen>
  );
}
