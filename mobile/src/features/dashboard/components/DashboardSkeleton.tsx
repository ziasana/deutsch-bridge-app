import { View } from 'react-native';
import { Card, Skeleton } from '@/components/ui';
import { useI18n } from '@/i18n';
import { spacing } from '@/theme';

export function DashboardSkeleton() {
  const { t } = useI18n();
  return (
    <View accessibilityLabel={t.home.loadingDashboard} style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Skeleton width="70%" height={28} />
        <Skeleton width="90%" height={16} />
      </View>
      <Card style={{ gap: spacing.md }}>
        <Skeleton width="40%" height={12} />
        <Skeleton height={24} />
        <Skeleton height={8} />
        <Skeleton height={48} />
      </Card>
      {[0, 1].map((i) => (
        <Card key={i} style={{ gap: spacing.md }}>
          <Skeleton width="50%" height={20} />
          <Skeleton height={16} />
          <Skeleton height={16} />
        </Card>
      ))}
    </View>
  );
}
