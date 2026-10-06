import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, TextField, WavePage } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import { passwordStrength, strengthHint } from '@/features/auth/passwordStrength';
import { Avatar } from './Avatar';
import { pickAvatar } from './avatarPicker';
import { useChangePassword, useUpdateProfile, useUploadAvatar } from './hooks';

const MIN_PASSWORD = 6;

/** Pure so it can be tested: what is wrong with the password form, if anything. */
export function passwordProblem(current: string, next: string, confirm: string): string | null {
  if (!current) return 'Bitte gib dein aktuelles Passwort ein.';
  if (next.length < MIN_PASSWORD)
    return `Das neue Passwort braucht mindestens ${MIN_PASSWORD} Zeichen.`;
  if (next !== confirm) return 'Die neuen Passwörter stimmen nicht überein.';
  if (next === current) return 'Das neue Passwort muss sich vom aktuellen unterscheiden.';
  return null;
}

/** Centred avatar on the wave, with a pencil badge that opens the photo picker. */
function Identity() {
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
          accessibilityLabel="Foto ändern"
          accessibilityHint="JPG, PNG oder WebP"
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
        {profile?.learningLevel ? `Niveau ${profile.learningLevel}` : 'Neu dabei'}
      </AppText>
      {pickError || upload.error ? (
        <AppText color={colors.destructive} accessibilityRole="alert" center>
          {pickError ?? upload.error?.message}
        </AppText>
      ) : null}
      {upload.isSuccess ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          ✓ Profilbild aktualisiert
        </AppText>
      ) : null}
    </View>
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
    <View style={styles.section}>
      <TextField
        pill
        neutral
        label="Name"
        value={value}
        onChangeText={setName}
        autoCorrect={false}
      />
      <TextField pill neutral label="E-Mail" value={profile?.email ?? ''} editable={false} />
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
          pill
          label="Name speichern"
          loading={update.isPending}
          onPress={() =>
            update.mutate({ displayName: value.trim() }, { onSuccess: () => setName(null) })
          }
        />
      ) : null}
      {joined ? (
        <AppText variant="small" color={colors.mutedForeground} style={styles.joined}>
          Dabei seit {joined}
        </AppText>
      ) : null}
    </View>
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
    <View style={styles.section}>
      <AppText style={styles.sectionTitle}>Passwort ändern</AppText>
      <TextField
        pill
        neutral
        label="Aktuelles Passwort"
        value={current}
        onChangeText={setCurrent}
        secret
        autoCapitalize="none"
      />
      <TextField
        pill
        neutral
        label="Neues Passwort"
        tint={next ? passwordStrength(next).color : undefined}
        hint={strengthHint(next)}
        value={next}
        onChangeText={setNext}
        secret
        autoCapitalize="none"
      />
      <TextField
        pill
        neutral
        label="Neues Passwort wiederholen"
        value={confirm}
        onChangeText={setConfirm}
        secret
        autoCapitalize="none"
      />
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
      <Button pill label="Passwort ändern" loading={change.isPending} onPress={submit} />
    </View>
  );
}

export function AccountScreen() {
  return (
    <WavePage title="Konto" variant="fall" header={<Identity />}>
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
