import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText, Card, ErrorState, Header, LoadingState, Screen, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { NotificationPreferences } from '@/types/notification';
import { useNotificationPreferences, useUpdateNotificationPreferences } from './hooks';
import { deviceTimezone, isValidTime } from './time';

type BooleanKey = {
  [K in keyof NotificationPreferences]: NotificationPreferences[K] extends boolean ? K : never;
}[keyof NotificationPreferences];

function ToggleRow({
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={[styles.row, disabled && { opacity: 0.5 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText>{label}</AppText>
        {hint ? (
          <AppText variant="small" color={colors.mutedForeground}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: colors.primary }}
      />
    </View>
  );
}

/** A time field that saves once the value is a valid HH:mm that differs from the saved one. */
function TimeField({
  label,
  saved,
  disabled,
  onSave,
}: {
  label: string;
  saved: string;
  disabled?: boolean;
  onSave: (value: string) => void;
}) {
  const [text, setText] = useState<string | null>(null);
  const value = text ?? saved;
  const invalid = text !== null && !isValidTime(text);
  return (
    <TextField
      label={label}
      value={value}
      editable={!disabled}
      onChangeText={(v) => {
        setText(v);
        if (isValidTime(v) && v !== saved) onSave(v);
      }}
      onBlur={() => setText(null)}
      keyboardType="numbers-and-punctuation"
      maxLength={5}
      placeholder="HH:mm"
      error={invalid ? 'Bitte im Format HH:mm eingeben, z. B. 18:30.' : undefined}
    />
  );
}

export function PreferencesScreen() {
  const query = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const prefs = query.data;
  const reportedTimezone = useRef(false);

  // Tell the backend the device timezone once, so reminders arrive at the learner's local time.
  const { mutate } = update;
  useEffect(() => {
    if (!prefs || prefs.timezone || reportedTimezone.current) return;
    const tz = deviceTimezone();
    if (tz) {
      reportedTimezone.current = true;
      mutate({ timezone: tz });
    }
  }, [prefs, mutate]);

  const save = (patch: Partial<NotificationPreferences>) => update.mutate(patch);
  const toggle = (key: BooleanKey, label: string, opts: { hint?: string; disabled?: boolean } = {}) =>
    prefs && (
      <ToggleRow label={label} hint={opts.hint} disabled={opts.disabled} value={prefs[key]} onChange={(v) => save({ [key]: v })} />
    );

  let body;
  if (query.isPending) body = <LoadingState label="Einstellungen werden geladen …" />;
  else if (query.isError || !prefs) body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  else {
    const learningOff = !prefs.learningRemindersEnabled;
    const progressOff = !prefs.progressNotificationsEnabled;
    const device = deviceTimezone();
    body = (
      <View style={{ gap: spacing.lg }}>
        <Card style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.primaryDark}>
            LERNEN
          </AppText>
          {toggle('learningRemindersEnabled', 'Tägliche Erinnerungen', { hint: 'Hauptschalter für alle Lern-Erinnerungen.' })}
          {toggle('reviewRemindersEnabled', 'Wiederholungs-Erinnerungen', { disabled: learningOff })}
          {toggle('dailyPlanRemindersEnabled', 'Tagesplan', { disabled: learningOff })}
          {toggle('examRemindersEnabled', 'Prüfungs-Erinnerungen', { disabled: learningOff })}
        </Card>

        <Card style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.primaryDark}>
            FORTSCHRITT
          </AppText>
          {toggle('progressNotificationsEnabled', 'Fortschritts-Meldungen')}
          {toggle('milestoneNotificationsEnabled', 'Meilensteine', { disabled: progressOff })}
          {toggle('weeklyProgressEnabled', 'Wochenrückblick', { disabled: progressOff })}
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <AppText variant="caption" color={colors.primaryDark}>
            ZEITPLAN
          </AppText>
          <TimeField
            label="Bevorzugte Erinnerungszeit"
            saved={prefs.preferredReminderTime}
            disabled={learningOff}
            onSave={(v) => save({ preferredReminderTime: v })}
          />
          {toggle('quietHoursEnabled', 'Ruhezeiten', { hint: 'In dieser Zeit bekommst du keine Erinnerungen.' })}
          {prefs.quietHoursEnabled ? (
            <>
              <TimeField label="Ruhezeit von" saved={prefs.quietHoursStart} onSave={(v) => save({ quietHoursStart: v })} />
              <TimeField label="Ruhezeit bis" saved={prefs.quietHoursEnd} onSave={(v) => save({ quietHoursEnd: v })} />
            </>
          ) : null}
          {prefs.timezone ? (
            <AppText variant="small" color={colors.mutedForeground}>
              Zeitzone: {prefs.timezone}
            </AppText>
          ) : null}
          {device && prefs.timezone && device !== prefs.timezone ? (
            <AppText
              accessibilityRole="button"
              color={colors.primaryDark}
              onPress={() => save({ timezone: device })}
            >
              Zeitzone dieses Geräts verwenden ({device})
            </AppText>
          ) : null}
        </Card>

        {update.isError ? (
          <AppText color={colors.destructive} accessibilityRole="alert">
            Die Einstellung konnte nicht gespeichert werden. Bitte versuche es erneut.
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <Screen keyboardAware>
      <Header title="Erinnerungen" subtitle="Was du wann erhalten möchtest" back />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
});
