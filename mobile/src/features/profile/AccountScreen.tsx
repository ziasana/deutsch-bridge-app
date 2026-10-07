import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, TextField, WavePage, ErrorNotice } from '@/components/ui';
import { useI18n } from '@/i18n';
import type { Dictionary } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import { passwordStrength } from '@/features/auth/passwordStrength';
import { Avatar } from './Avatar';
import { pickAvatar } from './avatarPicker';
import { useChangePassword, useUpdateProfile, useUploadAvatar } from './hooks';

const MIN_PASSWORD = 6;

/** Pure so it can be tested: what is wrong with the password form, if anything. */
export function passwordProblem(
  current: string,
  next: string,
  confirm: string,
  t: Dictionary['account'],
): string | null {
  if (!current) return t.enterCurrent;
  if (next.length < MIN_PASSWORD) return t.tooShort(MIN_PASSWORD);
  if (next !== confirm) return t.mismatch;
  if (next === current) return t.sameAsOld;
  return null;
}

/** Centred avatar on the wave, with a pencil badge that opens the photo picker. */
function Identity() {
  const { t } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const upload = useUploadAvatar();
  const [pickError, setPickError] = useState<string | null>(null);

  const change = async () => {
    setPickError(null);
    try {
      const file = await pickAvatar();
      if (file) upload.mutate(file);
    } catch (e) {
      setPickError(e instanceof Error ? e.message : t.account.photoFailed);
    }
  };

  return (
    <View style={styles.identity}>
      <View style={styles.avatarWrap}>
        <Avatar
          name={profile?.displayName}
          email={profile?.email}
          url={profile?.avatarUrl}
          size={124}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.account.changePhoto}
          accessibilityHint={t.account.photoHint}
          disabled={upload.isPending}
          onPress={() => void change()}
          style={styles.pencil}
        >
          <Ionicons
            name={upload.isPending ? 'hourglass-outline' : 'pencil'}
            size={18}
            color="#FFFFFF"
          />
        </Pressable>
      </View>
      <AppText style={styles.name}>{profile?.displayName}</AppText>
      <AppText color={colors.mutedForeground}>
        {profile?.learningLevel ? t.profile.levelLabel(profile.learningLevel) : t.profile.newHere}
      </AppText>
      {pickError || upload.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert" center>
          {pickError ?? upload.error?.message}
        </AppText>
      ) : null}
      {upload.isSuccess ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          {t.account.photoUpdated}
        </AppText>
      ) : null}
    </View>
  );
}

function NameSection() {
  const { t, language } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const update = useUpdateProfile();
  const [name, setName] = useState<string | null>(null);
  const value = name ?? profile?.displayName ?? '';
  const dirty = name !== null && name.trim() !== '' && name.trim() !== profile?.displayName;
  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <View style={styles.section}>
      <TextField
        pill
        neutral
        label={t.account.name}
        value={value}
        onChangeText={setName}
        autoCorrect={false}
      />
      <TextField
        pill
        neutral
        label={t.account.email}
        value={profile?.email ?? ''}
        editable={false}
      />
      {update.error ? <ErrorNotice error={update.error} /> : null}
      {update.isSuccess && !dirty ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          {t.common.saved}
        </AppText>
      ) : null}
      {dirty ? (
        <Button
          pill
          label={t.account.saveName}
          loading={update.isPending}
          onPress={() =>
            update.mutate({ displayName: value.trim() }, { onSuccess: () => setName(null) })
          }
        />
      ) : null}
      {joined ? (
        <AppText variant="small" color={colors.mutedForeground} style={styles.joined}>
          {t.account.joined(joined)}
        </AppText>
      ) : null}
    </View>
  );
}

function PasswordSection() {
  const { t } = useI18n();
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = () => {
    const issue = passwordProblem(current, next, confirm, t.account);
    setProblem(issue);
    if (issue) return;
    change.mutate(
      { current, next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
          setConfirm('');
        },
      },
    );
  };

  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>{t.account.changePassword}</AppText>
      <TextField
        pill
        neutral
        label={t.account.currentPassword}
        value={current}
        onChangeText={setCurrent}
        secret
        autoCapitalize="none"
      />
      <TextField
        pill
        neutral
        label={t.account.newPassword}
        tint={next ? passwordStrength(next).color : undefined}
        hint={
          next
            ? `${t.account.strength.label}: ${t.account.strength.levels[passwordStrength(next).score]}`
            : undefined
        }
        value={next}
        onChangeText={setNext}
        secret
        autoCapitalize="none"
      />
      <TextField
        pill
        neutral
        label={t.account.repeatPassword}
        value={confirm}
        onChangeText={setConfirm}
        secret
        autoCapitalize="none"
      />
      {problem || change.error ? <ErrorNotice message={problem ?? change.error?.message} /> : null}
      {change.isSuccess ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          {t.account.passwordChanged}
        </AppText>
      ) : null}
      <Button pill label={t.account.changePassword} loading={change.isPending} onPress={submit} />
    </View>
  );
}

export function AccountScreen() {
  const { t } = useI18n();
  return (
    <WavePage title={t.account.title} variant="fall" header={<Identity />}>
      <NameSection />
      <PasswordSection />
    </WavePage>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl },
  avatarWrap: {
    borderRadius: 70,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1D2433',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pencil: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4C6EF5',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: colors.ink,
    marginTop: spacing.sm,
  },
  section: { gap: spacing.lg },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: colors.ink },
  joined: { alignSelf: 'flex-end' },
});
