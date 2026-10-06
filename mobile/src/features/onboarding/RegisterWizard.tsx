import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, TextField } from '@/components/ui';
import { useRegister } from '@/features/auth/hooks';
import { passwordStrength, strengthHint } from '@/features/auth/passwordStrength';
import { emailSchema, nameSchema, passwordSchema } from '@/features/auth/schemas';
import { IntroHero } from '@/features/onboarding/IntroHero';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

type Step = 'intro' | 'name' | 'email' | 'password';
const ORDER: Step[] = ['intro', 'name', 'email', 'password'];

function FadeIn({ children, id }: { children: ReactNode; id: string }) {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [v, id]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function BackSquare({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Zurück"
      onPress={onPress}
      hitSlop={8}
      style={styles.back}
    >
      <Ionicons name="chevron-back" size={24} color={colors.ink} />
    </Pressable>
  );
}

function Intro({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.flex}>
      <IntroHero />
      <SafeAreaView edges={['bottom']} style={styles.introBody}>
        <FadeIn id="intro">
          <Text style={styles.introTitle} accessibilityRole="header">
            Erstelle dein Profil <Text style={styles.introBold}>jetzt!</Text>
          </Text>
          <AppText style={styles.introSub} color={colors.mutedForeground}>
            Mit einem Profil speicherst du deinen Lernfortschritt und lernst kostenlos weiter.
          </AppText>
        </FadeIn>
        <View style={styles.introActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zurück"
            onPress={() => router.back()}
            style={styles.textBtn}
          >
            <AppText variant="subheading" color={colors.primaryDark}>
              Zurück
            </AppText>
          </Pressable>
          <View style={styles.nextWrap}>
            <Button pill label="Weiter" onPress={onNext} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Step-by-step sign-up: intro → name → e-mail → password (with a strength hint). */
export function RegisterWizard() {
  const register = useRegister();
  const [step, setStep] = useState<Step>('intro');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const index = ORDER.indexOf(step);
  const go = (to: Step) => {
    setError(null);
    setStep(to);
  };
  const back = () => (index === 0 ? router.back() : go(ORDER[index - 1]));

  const advance = () => {
    const check =
      step === 'name'
        ? nameSchema.safeParse(name)
        : step === 'email'
          ? emailSchema.safeParse(email)
          : null;
    if (check && !check.success) {
      setError(check.error.issues[0].message);
      return;
    }
    go(ORDER[index + 1]);
  };

  const submit = () => {
    const check = passwordSchema.safeParse(password);
    if (!check.success) {
      setError(check.error.issues[0].message);
      return;
    }
    setError(null);
    register.mutate({ displayName: name.trim(), email: email.trim(), password });
  };

  if (step === 'intro') return <Intro onNext={() => go('name')} />;

  const strength = passwordStrength(password);
  const config = {
    name: {
      title: 'Wie heißt du?',
      label: 'Name',
      value: name,
      set: setName,
      props: { autoComplete: 'name', textContentType: 'name', autoCapitalize: 'words' } as const,
      action: 'Weiter',
      run: advance,
    },
    email: {
      title: 'Wie lautet deine E-Mail?',
      label: 'E-Mail',
      value: email,
      set: setEmail,
      props: {
        autoComplete: 'email',
        textContentType: 'emailAddress',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      } as const,
      action: 'Weiter',
      run: advance,
    },
    password: {
      title: 'Wähle dein Passwort',
      label: 'Passwort',
      value: password,
      set: setPassword,
      props: {
        secret: true,
        autoComplete: 'new-password',
        textContentType: 'newPassword',
        autoCapitalize: 'none',
      } as const,
      action: 'Starten',
      run: submit,
    },
  }[step];

  const isPassword = step === 'password';
  const serverError = isPassword ? register.error?.message : undefined;

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.stepContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackSquare onPress={back} />
          <FadeIn id={step}>
            <View style={styles.stepBody}>
              <AppText style={styles.stepTitle} center accessibilityRole="header">
                {config.title}
              </AppText>
              <TextField
                pill
                hideLabel
                centered={!isPassword}
                label={config.label}
                autoFocus
                returnKeyType={isPassword ? 'go' : 'next'}
                value={config.value}
                onChangeText={(t) => {
                  config.set(t);
                  if (error) setError(null);
                }}
                onSubmitEditing={config.run}
                error={error ?? serverError}
                tint={isPassword && password ? strength.color : undefined}
                hint={isPassword ? strengthHint(password) : undefined}
                {...config.props}
              />
              <Button
                pill
                label={config.action}
                loading={isPassword && register.isPending}
                onPress={config.run}
              />
              {step === 'name' ? (
                <AppText variant="small" color={colors.mutedForeground} center>
                  Schon ein Konto?{' '}
                  <Link href="/login" accessibilityRole="link" style={styles.link}>
                    Anmelden
                  </Link>
                </AppText>
              ) : null}
            </View>
          </FadeIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  introBody: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' },
  introTitle: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '400',
    color: colors.ink,
    marginTop: spacing.xl,
  },
  introBold: { fontWeight: '800' },
  introSub: { fontSize: 16, lineHeight: 24, marginTop: spacing.lg },
  introActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
  },
  textBtn: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.xl },
  nextWrap: { width: 150 },
  stepContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  stepBody: { gap: spacing.xl, paddingTop: spacing.xl },
  stepTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: colors.ink },
  back: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D2433',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  link: { color: colors.primaryDark, fontWeight: '600' },
});
