import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { FocusedLightStatusBar } from './HeroScreen';
import { useHeaderScroll } from './useHeaderScroll';
import { useI18n } from '@/i18n';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

/**
 * rise – blue is low on the left and sweeps up to the right (Profile tab)
 * fall – blue is high on the left and sweeps down to the right (Account page)
 * arc  – a plain rounded blue cap for pages without an identity block (Settings)
 */
export type WaveVariant = 'rise' | 'fall' | 'arc';

/** Blue header whose lower edge is carved by an oversized white disc. Clipped to its own height. */
export function WaveBackdrop({ variant }: { variant: WaveVariant }) {
  const { width: w } = useWindowDimensions();
  if (variant === 'arc') {
    const h = w * 0.33;
    return (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -w * 0.25,
          width: w * 1.5,
          top: -h,
          height: h * 2,
          backgroundColor: colors.brand,
          borderBottomLeftRadius: w * 0.75,
          borderBottomRightRadius: w * 0.75,
        }}
      />
    );
  }
  const disc =
    variant === 'rise'
      ? { size: w * 4.39, left: -w * 1.08, top: w * 0.224, blue: w * 0.6 }
      : { size: w * 2.368, left: -w * 1.184, top: w * 0.35, blue: w * 0.95 };
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: disc.blue,
        overflow: 'hidden',
        backgroundColor: colors.brand,
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: disc.size,
          height: disc.size,
          borderRadius: disc.size / 2,
          left: disc.left,
          top: disc.top,
          backgroundColor: '#FFFFFF',
        }}
      />
    </View>
  );
}

type Props = {
  title: string;
  variant?: WaveVariant;
  /** Content shown right under the title bar, on top of the wave (e.g. the avatar). */
  header?: ReactNode;
  children: ReactNode;
};

/** Pushed-page layout: wave header with a white back button and centred title, then the content. */
export function WavePage({ title, variant = 'arc', header, children }: Props) {
  const { t, isRTL } = useI18n();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scroll = useHeaderScroll(width * 0.2);
  return (
    <View style={styles.root}>
      <FocusedLightStatusBar dark={scroll.gone} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scroll.ref}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          onScroll={scroll.onScroll}
          scrollEventThrottle={scroll.scrollEventThrottle}
        >
          {/* Inside the scroll content so the blue header scrolls away with it. */}
          <WaveBackdrop variant={variant} />
          <SafeAreaView edges={['top']}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.common.back}
                onPress={() => router.back()}
                hitSlop={8}
                style={styles.squareBtn}
              >
                <Ionicons
                  name={isRTL ? 'chevron-forward' : 'chevron-back'}
                  size={24}
                  color={colors.ink}
                />
              </Pressable>
              <AppText style={styles.title} color="#FFFFFF" accessibilityRole="header">
                {title}
              </AppText>
              <View style={styles.side} />
            </View>
            {header}
          </SafeAreaView>
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  side: { width: MIN_TOUCH },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  squareBtn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D2433',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
});
