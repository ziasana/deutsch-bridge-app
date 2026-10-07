import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, Card, Chip, WavePage } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing } from '@/theme';
import type { PreferredLanguage } from '@/types/user';
import { useUpdateProfile } from './hooks';

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const WORD_GOALS = [5, 10, 15, 20];
// DE exists in the backend enum, but the web app only offers English and Persian.
export const LANGUAGES: { value: PreferredLanguage; label: string }[] = [
  { value: 'EN', label: '🇬🇧 English' },
  { value: 'PR', label: '🇮🇷 فارسی' },
];

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="subheading">{title}</AppText>
      {hint ? (
        <AppText variant="small" color={colors.mutedForeground}>
          {hint}
        </AppText>
      ) : null}
      <View style={styles.chips} accessibilityRole="radiogroup">
        {children}
      </View>
    </View>
  );
}

/** Learning preferences: level, daily word goal and explanation language, saved together. */
export function SettingsScreen() {
  const { t } = useI18n();
  const profile = useAuthStore((s) => s.profile);
  const update = useUpdateProfile();
  // Only edits live here; everything else is read from the session profile.
  const [draft, setDraft] = useState<{
    learningLevel?: string;
    dailyGoalWords?: number;
    preferredLanguage?: PreferredLanguage;
  }>({});

  const level = draft.learningLevel ?? profile?.learningLevel ?? undefined;
  const goal = draft.dailyGoalWords ?? profile?.dailyGoalWords ?? undefined;
  const language = draft.preferredLanguage ?? profile?.preferredLanguage ?? 'EN';

  const changes = {
    ...(draft.learningLevel && draft.learningLevel !== profile?.learningLevel
      ? { learningLevel: draft.learningLevel }
      : {}),
    ...(draft.dailyGoalWords && draft.dailyGoalWords !== profile?.dailyGoalWords
      ? { dailyGoalWords: draft.dailyGoalWords }
      : {}),
    ...(draft.preferredLanguage && draft.preferredLanguage !== profile?.preferredLanguage
      ? { preferredLanguage: draft.preferredLanguage }
      : {}),
  };
  const dirty = Object.keys(changes).length > 0;

  return (
    <WavePage title={t.settings.title}>
      <Card style={{ gap: spacing.xl }}>
        <Group title={t.settings.level}>
          {LEVELS.map((l) => (
            <Chip
              key={l}
              label={l}
              selected={level === l}
              onPress={() => setDraft((d) => ({ ...d, learningLevel: l }))}
            />
          ))}
        </Group>
        <Group title={t.settings.dailyGoal} hint={t.settings.dailyGoalHint}>
          {WORD_GOALS.map((n) => (
            <Chip
              key={n}
              label={t.settings.words(n)}
              selected={goal === n}
              onPress={() => setDraft((d) => ({ ...d, dailyGoalWords: n }))}
            />
          ))}
        </Group>
        <Group title={t.settings.language} hint={t.settings.languageHint}>
          {LANGUAGES.map((l) => (
            <Chip
              key={l.value}
              label={l.label}
              selected={language === l.value}
              onPress={() => setDraft((d) => ({ ...d, preferredLanguage: l.value }))}
            />
          ))}
        </Group>
      </Card>

      {update.isError ? (
        <AppText color={colors.destructive} accessibilityRole="alert">
          {update.error.message}
        </AppText>
      ) : null}
      {update.isSuccess && !dirty ? (
        <AppText color="#1B7A55" accessibilityRole="alert">
          {t.common.saved}
        </AppText>
      ) : null}

      {dirty ? (
        <View style={{ gap: spacing.sm }}>
          <Button
            pill
            label={t.settings.save}
            loading={update.isPending}
            onPress={() => update.mutate(changes, { onSuccess: () => setDraft({}) })}
          />
          <Button
            pill
            label={t.settings.discard}
            variant="secondary"
            onPress={() => {
              setDraft({});
              update.reset();
            }}
          />
        </View>
      ) : null}
    </WavePage>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
