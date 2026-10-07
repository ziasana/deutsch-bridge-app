import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import {
  AppText,
  Card,
  ErrorState,
  Header,
  LoadingState,
  Screen,
  TextField,
  ErrorNotice,
} from '@/components/ui';
import { useI18n } from '@/i18n';
import { colors, spacing } from '@/theme';
import type { NotificationPreferences } from '@/types/notification';
import { PushCard } from './PushCard';
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
  const { t } = useI18n();
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
      error={invalid ? t.notifications.prefs.timeFormat : undefined}
    />
  );
}

export function PreferencesScreen() {
  const { t } = useI18n();
  const p = t.notifications.prefs;
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
  const toggle = (
    key: BooleanKey,
    label: string,
    opts: { hint?: string; disabled?: boolean } = {},
  ) =>
    prefs && (
      <ToggleRow
        label={label}
        hint={opts.hint}
        disabled={opts.disabled}
        value={prefs[key]}
        onChange={(v) => save({ [key]: v })}
      />
    );

  let body;
  if (query.isPending) body = <LoadingState label={p.loading} />;
  else if (query.isError || !prefs)
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  else {
    const learningOff = !prefs.learningRemindersEnabled;
    const progressOff = !prefs.progressNotificationsEnabled;
    const device = deviceTimezone();
    body = (
      <View style={{ gap: spacing.lg }}>
        <PushCard />
        <Card style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.primaryDark}>
            {p.learning.toUpperCase()}
          </AppText>
          {toggle('learningRemindersEnabled', p.dailyReminders, { hint: p.dailyRemindersHint })}
          {toggle('reviewRemindersEnabled', p.reviewReminders, { disabled: learningOff })}
          {toggle('dailyPlanRemindersEnabled', p.dailyPlan, { disabled: learningOff })}
          {toggle('examRemindersEnabled', p.examReminders, { disabled: learningOff })}
        </Card>

        <Card style={{ gap: spacing.xs }}>
          <AppText variant="caption" color={colors.primaryDark}>
            {p.progress.toUpperCase()}
          </AppText>
          {toggle('progressNotificationsEnabled', p.progressUpdates)}
          {toggle('milestoneNotificationsEnabled', p.milestones, { disabled: progressOff })}
          {toggle('weeklyProgressEnabled', p.weekly, { disabled: progressOff })}
        </Card>

        <Card style={{ gap: spacing.sm }}>
          <AppText variant="caption" color={colors.primaryDark}>
            {p.schedule.toUpperCase()}
          </AppText>
          <TimeField
            label={p.preferredTime}
            saved={prefs.preferredReminderTime}
            disabled={learningOff}
            onSave={(v) => save({ preferredReminderTime: v })}
          />
          {toggle('quietHoursEnabled', p.quietHours, { hint: p.quietHoursHint })}
          {prefs.quietHoursEnabled ? (
            <>
              <TimeField
                label={p.quietFrom}
                saved={prefs.quietHoursStart}
                onSave={(v) => save({ quietHoursStart: v })}
              />
              <TimeField
                label={p.quietTo}
                saved={prefs.quietHoursEnd}
                onSave={(v) => save({ quietHoursEnd: v })}
              />
            </>
          ) : null}
          {prefs.timezone ? (
            <AppText variant="small" color={colors.mutedForeground}>
              {p.timeZone(prefs.timezone)}
            </AppText>
          ) : null}
          {device && prefs.timezone && device !== prefs.timezone ? (
            <AppText
              accessibilityRole="button"
              color={colors.primaryDark}
              onPress={() => save({ timezone: device })}
            >
              {p.useDeviceZone(device)}
            </AppText>
          ) : null}
        </Card>

        {update.isError ? <ErrorNotice message={p.saveFailed} /> : null}
      </View>
    );
  }

  return (
    <Screen keyboardAware>
      <Header title={p.title} subtitle={p.subtitle} back />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
});
