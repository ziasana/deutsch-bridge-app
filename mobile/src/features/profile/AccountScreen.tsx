import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Header, Screen, TextField } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import { Avatar } from './Avatar';
import { pickAvatar } from './avatarPicker';
import { useChangePassword, useUpdateProfile, useUploadAvatar } from './hooks';

const MIN_PASSWORD = 6;

/** Pure so it can be tested: what is wrong with the password form, if anything. */
export function passwordProblem(current: string, next: string, confirm: string): string | null {
  if (!current) return 'Bitte gib dein aktuelles Passwort ein.';
  if (next.length < MIN_PASSWORD) return `Das neue Passwort braucht mindestens ${MIN_PASSWORD} Zeichen.`;
  if (next !== confirm) return 'Die neuen Passwörter stimmen nicht überein.';
  if (next === current) return 'Das neue Passwort muss sich vom aktuellen unterscheiden.';
  return null;
}

function PhotoSection() {
  const profile = useAuthStore((s) => s.profile);
  const upload = useUploadAvatar();
  const [pickError, setPickError] = useState<string | null>(null);

  const change = async () => {
    setPickError(null);
    try {
      const file = await pickAvatar();
      if (file) upload.mutate(file);
    } catch (e) {
      setPickError(e instanceof Error ? e.message : 'Das Bild konnte nicht geöffnet werden.');
    }
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="subheading">Profilbild</AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={profile?.displayName} email={profile?.email} url={profile?.avatarUrl} size={72} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Button label="Foto ändern" variant="secondary" loading={upload.isPending} onPress={() => void change()} />
          <AppText variant="caption" color={colors.mutedForeground}>
            JPG, PNG oder WebP
          </AppText>
        </View>
      </View>
      {pickError || upload.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {pickError ?? upload.error?.message}
        </AppText>
      ) : null}
      {upload.isSuccess ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          ✓ Profilbild aktualisiert
        </AppText>
      ) : null}
    </Card>
  );
}

function NameSection() {
  const profile = useAuthStore((s) => s.profile);
  const update = useUpdateProfile();
  const [name, setName] = useState<string | null>(null);
  const value = name ?? profile?.displayName ?? '';
  const dirty = name !== null && name.trim() !== '' && name.trim() !== profile?.displayName;
  const joined = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    : null;

  return (
    <Card style={{ gap: spacing.md }}>
      <AppText variant="subheading">Konto</AppText>
      <TextField label="Name" value={value} onChangeText={setName} autoCorrect={false} />
      <TextField label="E-Mail" value={profile?.email ?? ''} editable={false} />
      {joined ? (
        <AppText variant="small" color={colors.mutedForeground}>
          Dabei seit {joined}
        </AppText>
      ) : null}
      {update.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {update.error.message}
        </AppText>
      ) : null}
      {update.isSuccess && !dirty ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          ✓ Gespeichert
        </AppText>
      ) : null}
      {dirty ? (
        <Button
          label="Name speichern"
          loading={update.isPending}
          onPress={() => update.mutate({ displayName: value.trim() }, { onSuccess: () => setName(null) })}
        />
      ) : null}
    </Card>
  );
}

function PasswordSection() {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  const submit = () => {
    const issue = passwordProblem(current, next, confirm);
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
    <Card style={{ gap: spacing.md }}>
      <AppText variant="subheading">Passwort ändern</AppText>
      <TextField label="Aktuelles Passwort" value={current} onChangeText={setCurrent} secret autoCapitalize="none" />
      <TextField label="Neues Passwort" value={next} onChangeText={setNext} secret autoCapitalize="none" />
      <TextField label="Neues Passwort wiederholen" value={confirm} onChangeText={setConfirm} secret autoCapitalize="none" />
      {problem || change.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {problem ?? change.error?.message}
        </AppText>
      ) : null}
      {change.isSuccess ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          ✓ Passwort geändert
        </AppText>
      ) : null}
      <Button label="Passwort ändern" loading={change.isPending} onPress={submit} />
    </Card>
  );
}

export function AccountScreen() {
  return (
    <Screen keyboardAware>
      <Header title="Account" subtitle="Profil und Passwort" back />
      <PhotoSection />
      <NameSection />
      <PasswordSection />
    </Screen>
  );
}
