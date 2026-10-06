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
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
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

/** Exam illustration: an answer sheet with ticks, a puzzle piece clicking into place and a pencil — decoration only. */
function ExamIllustration({ size, style }: { size: number; style: object }) {
  return (
    <View style={[{ position: 'absolute', width: size, height: size * 0.93 }, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 140 130">
        <Circle cx="72" cy="66" r="54" fill="#FFFFFF" fillOpacity={0.16} />
        <Circle cx="120" cy="20" r="5" fill="#FFFFFF" fillOpacity={0.5} />
        <Circle cx="12" cy="100" r="4" fill="#FFFFFF" fillOpacity={0.4} />
        <Path d="M22 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFFFFF" fillOpacity={0.7} />

        <G rotation={-6} origin="60, 64">
          <Rect x="28" y="16" width="66" height="88" rx="9" fill="#FFFFFF" />
          <Rect x="28" y="16" width="66" height="19" rx="9" fill="#1E5FB8" />
          <Rect x="28" y="26" width="66" height="9" fill="#1E5FB8" />
          <Rect x="38" y="22" width="24" height="5" rx="2.5" fill="#FFFFFF" fillOpacity={0.85} />
          {[46, 62, 78].map((y, i) => (
            <G key={y}>
              <Rect
                x="38"
                y={y}
                width="11"
                height="11"
                rx="3"
                fill={i < 2 ? '#22A06B' : '#FFFFFF'}
                stroke={i < 2 ? '#22A06B' : '#9DB8DC'}
                strokeWidth="1.8"
              />
              {i < 2 && (
                <Path
                  d={`M40.5 ${y + 5.5}l2.6 2.8 4-5.2`}
                  stroke="#FFFFFF"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
              <Rect x="55" y={y + 2} width={i === 1 ? 26 : 32} height="3.5" rx="1.75" fill="#C9D9EE" />
              <Rect x="55" y={y + 7.5} width={i === 2 ? 16 : 22} height="3" rx="1.5" fill="#E2EBF6" />
            </G>
          ))}
        </G>

        <G rotation={12} origin="104, 92" x="86" y="62">
          <Path
            d="M0 8a4 4 0 0 1 4-4h9a7 7 0 1 1 14 0h9a4 4 0 0 1 4 4v9a7 7 0 1 0 0 14v9a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4z"
            fill="#FFC53D"
            stroke="#E0A100"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <Path d="M10 15h18" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth="3" strokeLinecap="round" />
        </G>

        <G rotation={-38} origin="0, 0" x="16" y="96">
          <Rect x="0" y="0" width="46" height="9" rx="2" fill="#FF8FA3" />
          <Rect x="9" y="0" width="37" height="9" fill="#FFD166" />
          <Path d="M46 0l9 4.5L46 9z" fill="#F6E3C3" />
          <Path d="M51.5 3l3.5 1.5-3.5 1.5z" fill="#33415C" />
        </G>
      </Svg>
    </View>
  );
}

/**
 * Search-style page: light-blue sky header with an exam/puzzle illustration and a large title, a floating search card
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
          <ExamIllustration size={150} style={{ right: 14, top: 44 }} />
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
  hero: { paddingBottom: 64, minHeight: 210 },
  // Extends upward so pulling the page down shows sky, not white.
  skyFill: { position: 'absolute', top: -600, left: 0, right: 0, bottom: 0, backgroundColor: SKY },
  heroText: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingRight: 150, gap: 4 },
  title: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '500' },
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
