import { useRouter } from 'expo-router';
import { AppText, Card, ListItem } from '@/components/ui';
import type { Destination } from './destinations';

export function DestinationList({ items }: { items: Destination[] }) {
  const router = useRouter();
  return (
    <Card>
      {items.map((item) => (
        <ListItem
          key={item.key}
          title={item.title}
          subtitle={item.subtitle}
          leading={<AppText style={{ fontSize: 24 }}>{item.emoji}</AppText>}
          trailing={<AppText>›</AppText>}
          onPress={() => router.push(item.href)}
        />
      ))}
    </Card>
  );
}
