import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors } from '@/theme';
import { resolveUploadUrl } from '@/utils/urls';
import { initialsOf } from './avatarPicker';

type Props = { name?: string | null; email?: string | null; url?: string | null; size?: number };

/** The learner's photo, or their initials when there is none. */
export function Avatar({ name, email, url, size = 56 }: Props) {
  const src = resolveUploadUrl(url);
  const box = { width: size, height: size, borderRadius: size / 2 };
  return src ? (
    <Image
      source={{ uri: src }}
      contentFit="cover"
      style={[styles.base, box]}
      accessibilityLabel={`Profilbild von ${name ?? 'dir'}`}
    />
  ) : (
    <View style={[styles.base, styles.fallback, box]} accessibilityLabel="Profilbild nicht gesetzt">
      <AppText style={{ fontSize: size * 0.36, lineHeight: size * 0.5, fontWeight: '700' }} color={colors.primaryDark}>
        {initialsOf(name, email)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.muted },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
});
