import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
  /** Heading inside the white sheet. */
  sheetTitle?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  children: ReactNode;
};

/** Small "studying" illustration built from shapes so it needs no image asset. */
function HeroArt() {
  return (
    <View style={styles.art} accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={styles.blob}>
        <Ionicons name="book" size={54} color={colors.primaryDark} />
      </View>
      <View
        style={[
          styles.dot,
          { top: 2, right: 6, width: 22, height: 22, backgroundColor: '#2F6FDB' },
        ]}
      />
      <View
        style={[
          styles.dot,
          { top: 40, left: 0, width: 12, height: 12, backgroundColor: 'rgba(255,255,255,0.7)' },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            bottom: 18,
            right: -6,
            width: 14,
            height: 14,
            backgroundColor: 'rgba(255,255,255,0.55)',
          },
        ]}
      />
      <Ionicons
        name="sparkles"
        size={22}
        color="rgba(255,255,255,0.95)"
        style={{ position: 'absolute', top: 18, left: 18 }}
      />
      <Ionicons
        name="sparkles"
        size={14}
        color="rgba(255,255,255,0.8)"
        style={{ position: 'absolute', bottom: 24, left: 4 }}
      />
    </View>
  );
}

/** Light status bar for a blue header — only while the (always mounted) tab screen is focused. */
export function FocusedLightStatusBar({ dark }: { dark?: boolean } = {}) {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused ? <StatusBar style={dark ? 'dark' : 'light'} /> : null;
}

/**
 * Content-page layout: blue greeting hero on top, white rounded sheet below with a drag-handle
 * accent. Used by the Learn tab; shares its look with the welcome and onboarding screens.
 */
export function HeroScreen({ title, subtitle, sheetTitle, refreshControl, children }: Props) {
  return (
    <View style={styles.root}>
      <FocusedLightStatusBar />
      <View style={styles.backdrop} />
      <ScrollView
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <SafeAreaView edges={['top']} style={styles.hero}>
          <View style={styles.heroText}>
            <AppText style={styles.title} color="#FFFFFF" accessibilityRole="header">
              {title}
            </AppText>
            <AppText style={styles.subtitle} color="#FFFFFF">
              {subtitle}
            </AppText>
          </View>
          <HeroArt />
        </SafeAreaView>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {sheetTitle ? (
            <AppText style={styles.sheetTitle} center accessibilityRole="header">
              {sheetTitle}
            </AppText>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    backgroundColor: colors.brand,
  },
  scroll: { flexGrow: 1 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  heroText: { flex: 1, gap: spacing.sm, paddingRight: spacing.md },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '800' },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '500' },
  art: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  blob: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#F2F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { position: 'absolute', borderRadius: 12 },
  sheet: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 64,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  sheetTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.ink,
    marginTop: spacing.sm,
  },
});
