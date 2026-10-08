import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { AppText, Button, DirectionalIcon, TextField } from '@/components/ui';
import { GoogleButton } from '@/features/auth/GoogleButton';
import { useRegister } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/serverError';
import { passwordStrength } from '@/features/auth/passwordStrength';
import { createAuthSchemas } from '@/features/auth/schemas';
import { useI18n } from '@/i18n';
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
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.entry.common.back}
      onPress={onPress}
      hitSlop={8}
      style={styles.back}
    >
      <DirectionalIcon name="chevron-back" size={24} color={colors.ink} />
    </Pressable>
  );
}

function Intro({ onNext }: { onNext: () => void }) {
  const { t } = useI18n();
  const r = t.entry.register;
  return (
    <View style={styles.flex}>
      <IntroHero />
      <SafeAreaView edges={['bottom']} style={styles.introBody}>
        <FadeIn id="intro">
          <Text style={styles.introTitle} accessibilityRole="header">
            {r.introTitle} <Text style={styles.introBold}>{r.introBold}</Text>
          </Text>
          <AppText style={styles.introSub} color={colors.mutedForeground}>
            {r.introSub}
          </AppText>
        </FadeIn>
        <View style={styles.introActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.entry.common.back}
            onPress={() => router.back()}
            style={styles.textBtn}
          >
            <AppText variant="subheading" color={colors.primaryDark}>
              {t.entry.common.back}
            </AppText>
          </Pressable>
          <View style={styles.nextWrap}>
            <Button pill label={t.entry.common.next} onPress={onNext} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** Step-by-step sign-up: intro → name → e-mail → password (with a strength hint). */
export function RegisterWizard() {
  const register = useRegister();
  const { t } = useI18n();
  const a = t.entry.auth;
  const r = t.entry.register;
  const { emailSchema, nameSchema, passwordSchema } = useMemo(
    () => createAuthSchemas(a.errors),
    [a.errors],
  );
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
      title: r.name.title,
      label: r.name.label,
      value: name,
      set: setName,
      props: { autoComplete: 'name', textContentType: 'name', autoCapitalize: 'words' } as const,
      action: t.entry.common.next,
      run: advance,
    },
    email: {
      title: r.email.title,
      label: r.email.label,
      value: email,
      set: setEmail,
      props: {
        autoComplete: 'email',
        textContentType: 'emailAddress',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
      } as const,
      action: t.entry.common.next,
      run: advance,
    },
    password: {
      title: r.password.title,
      label: r.password.label,
      value: password,
      set: setPassword,
      props: {
        secret: true,
        autoComplete: 'new-password',
        textContentType: 'newPassword',
        autoCapitalize: 'none',
      } as const,
      action: t.entry.register.start,
      run: submit,
    },
  }[step];

  const isPassword = step === 'password';
  const serverError = isPassword ? authErrorMessage(register.error, a.serverErrors) : undefined;

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
                hint={
                  isPassword && password
                    ? a.strength.hint(a.strength.levels[strength.score])
                    : undefined
                }
                {...config.props}
              />
              <Button
                pill
                label={config.action}
                loading={isPassword && register.isPending}
                onPress={config.run}
              />
              {step === 'name' ? <GoogleButton signUp /> : null}
              {step === 'name' ? (
                <AppText variant="small" color={colors.mutedForeground} center>
                  {r.haveAccount}{' '}
                  <Link href="/login" accessibilityRole="link" style={styles.link}>
                    {r.logIn}
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
