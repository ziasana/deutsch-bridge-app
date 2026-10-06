import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user';
import { I18nProvider, useI18n } from '../I18nProvider';
import { dictionaries, isRtlLanguage, toAppLanguage } from '../translations';

const shape = (value: unknown): unknown =>
  typeof value === 'function'
    ? 'fn'
    : Array.isArray(value)
      ? value.map(shape)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]))
        : typeof value;

function Probe() {
  const { t, dir, language } = useI18n();
  return (
    <View testID="probe">
      <Text>{`${language}|${dir}|${t.tabs.profile}`}</Text>
    </View>
  );
}

const setLanguage = (preferredLanguage: UserProfile['preferredLanguage']) =>
  useAuthStore.setState({ profile: { preferredLanguage } as UserProfile });

afterEach(() => useAuthStore.setState({ profile: null }));

describe('toAppLanguage', () => {
  it('maps PR to Persian and everything else to English, like the web app', () => {
    expect(toAppLanguage('PR')).toBe('fa');
    expect(toAppLanguage('EN')).toBe('en');
    expect(toAppLanguage('DE')).toBe('en');
    expect(toAppLanguage(null)).toBe('en');
    expect(toAppLanguage(undefined)).toBe('en');
    expect(isRtlLanguage('fa')).toBe(true);
    expect(isRtlLanguage('en')).toBe(false);
  });
});

describe('dictionaries', () => {
  it('has the same keys (and function/array shapes) in English and Persian', () => {
    expect(shape(dictionaries.fa)).toEqual(shape(dictionaries.en));
  });

  it('interpolates', () => {
    expect(dictionaries.en.profile.newCount(3)).toBe('3 new');
    expect(dictionaries.fa.profile.newCount(3)).toContain('3');
  });
});

describe('I18nProvider', () => {
  it('uses English and LTR without a profile or for EN/DE', async () => {
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByText('en|ltr|Profile')).toBeTruthy();
  });

  it('switches to Persian UI and an RTL root when the profile language is PR', async () => {
    setLanguage('PR');
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByText('fa|rtl|پروفایل')).toBeTruthy();
    const root = screen.getByTestId('probe').parent;
    expect(StyleSheet.flatten(root?.props.style).direction).toBe('rtl');
  });

  it('follows the profile live, without a restart', async () => {
    setLanguage('EN');
    await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByText('en|ltr|Profile')).toBeTruthy();
    useAuthStore.setState({ profile: { preferredLanguage: 'PR' } as UserProfile });
    expect(await screen.findByText('fa|rtl|پروفایل')).toBeTruthy();
  });
});
