import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, NotFoundIllustration } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** Shown for any address the app does not know (a broken link or an old notification target). */
export default function NotFoundRoute() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <NotFoundIllustration width={280} />
        <AppText style={styles.title} center accessibilityRole="header">
          Seite nicht gefunden
        </AppText>
        <AppText center color={colors.ink} style={styles.text}>
          Entschuldigung, diese Seite gibt es nicht. Prüfe den Link noch einmal oder gehe zurück zur
          Startseite.
        </AppText>
        <View style={{ alignSelf: 'stretch', marginTop: spacing.md }}>
          <Button pill label="Zur Startseite" onPress={() => router.replace('/')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#000000',
    marginTop: spacing.md,
  },
  text: { fontSize: 16, lineHeight: 24 },
});
