import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { radius, spacing } from '@/theme';
import type { ResultStatus } from '@/types/examSimulation';
import { RESULT_LABEL, RESULT_TONE } from './format';

export function ResultBadge({ status }: { status: ResultStatus | null | undefined }) {
  if (!status) return null;
  const tone = RESULT_TONE[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <AppText variant="caption" color={tone.fg} style={{ fontWeight: '800' }}>
        {RESULT_LABEL[status]}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
});
