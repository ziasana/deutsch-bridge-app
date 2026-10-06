import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { FocusedLightStatusBar } from './HeroScreen';
import { useHeaderScroll } from './useHeaderScroll';
import { colors, radius, spacing } from '@/theme';

const SKY = '#58A6F5';

type Props = {
  title: string;
  subtitle: string;
  search?: { value: string; onChange: (text: string) => void; placeholder: string; label: string };
  /** Replaces the search field in the floating slot (e.g. a summary card). */
  floating?: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /** Lets the page scroll itself, e.g. to a section after a tap. */
  scrollRef?: React.Ref<ScrollView>;
  children: ReactNode;
};

/** A soft cloud made of overlapping circles — decoration only. */
function Cloud({ width, style }: { width: number; style: object }) {
  const h = width * 0.45;
  return (
    <View style={[{ position: 'absolute', width, height: h }, style]} pointerEvents="none">
      <View style={[styles.puff, { left: 0, bottom: 0, width: h * 0.9, height: h * 0.9 }]} />
      <View
        style={[styles.puff, { left: width * 0.25, bottom: 0, width: h * 1.25, height: h * 1.25 }]}
      />
      <View style={[styles.puff, { right: 0, bottom: 0, width: h * 0.9, height: h * 0.9 }]} />
      <View
        style={[
          styles.puff,
          { left: width * 0.1, right: width * 0.1, bottom: 0, height: h * 0.55, borderRadius: h },
        ]}
      />
    </View>
  );
}

/**
 * Search-style page: light-blue sky header with clouds and a large title, a floating search card
 * overlapping its lower edge, then the content. The header scrolls away with the page.
 */
export function SkyScreen({ title, subtitle, search, floating, refreshControl, scrollRef, children }: Props) {
  const { width } = useWindowDimensions();
  const scroll = useHeaderScroll(width * 0.25);
  return (
    <View style={styles.root}>
      <FocusedLightStatusBar dark={scroll.gone} />
      <ScrollView
        ref={scrollRef}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        onScroll={scroll.onScroll}
        scrollEventThrottle={scroll.scrollEventThrottle}
      >
        <View style={styles.hero}>
          <View style={styles.skyFill} />
          <Cloud width={104} style={{ right: 28, top: 74, opacity: 0.95 }} />
          <Cloud width={60} style={{ right: 8, top: 150, opacity: 0.9 }} />
          <SafeAreaView edges={['top']}>
            <View style={styles.heroText}>
              <AppText style={styles.title} color="#FFFFFF" accessibilityRole="header">
                {title}
              </AppText>
              <AppText style={styles.subtitle} color="#FFFFFF">
                {subtitle}
              </AppText>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.searchWrap}>
          {floating ??
            (search ? (
              <View style={styles.search}>
                <TextInput
                  accessibilityLabel={search.label}
                  placeholder={search.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={search.value}
                  onChangeText={search.onChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  style={styles.input}
                />
                <Ionicons name="search-outline" size={24} color={colors.mutedForeground} />
              </View>
            ) : null)}
        </View>

        <View style={styles.content}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  hero: { paddingBottom: 56 },
  // Extends upward so pulling the page down shows sky, not white.
  skyFill: { position: 'absolute', top: -600, left: 0, right: 0, bottom: 0, backgroundColor: SKY },
  heroText: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: 2 },
  title: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '500' },
  puff: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFFFFF' },
  searchWrap: { marginTop: -30, paddingHorizontal: spacing.xl },
  search: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1D2433',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  input: { flex: 1, minHeight: 56, fontSize: 17, color: colors.foreground },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
});
