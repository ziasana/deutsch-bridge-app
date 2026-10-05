import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, ListItem } from '@/components/ui';
import { colors, radius } from '@/theme';
import type { ExpressionListItem } from '@/types/expression';
import { resolveUploadUrl } from '@/utils/urls';
import { MASTERY_LABEL } from '../labels';
import { meaningLine } from '../practiceLogic';

type Props = { item: ExpressionListItem; onPress: () => void };

/** One expression in a list: the phrase, its meaning, level, mastery and a saved marker. */
export function ExpressionRow({ item, onPress }: Props) {
  const image = resolveUploadUrl(item.imageUrl);
  return (
    <ListItem
      title={item.expression}
      subtitle={meaningLine(item.meaningDe, item.meaningEn)}
      leading={
        image ? (
          <Image
            source={{ uri: image }}
            contentFit="cover"
            style={styles.thumb}
            accessibilityIgnoresInvertColors
          />
        ) : undefined
      }
      trailing={
        <View style={styles.trailing}>
          <Badge tone="primary" label={item.level} />
          <Badge
            tone={item.masteryLevel === 'NEW' ? 'neutral' : 'success'}
            label={MASTERY_LABEL[item.masteryLevel]}
          />
          {item.bookmarked ? (
            <AppText accessibilityLabel="Gemerkt" color={colors.warning}>
              ★
            </AppText>
          ) : null}
        </View>
      }
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  thumb: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.muted },
  trailing: { alignItems: 'flex-end', gap: 4 },
});
