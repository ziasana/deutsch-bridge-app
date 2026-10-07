import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { I18nManager, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import {
  dictionaries,
  isRtlLanguage,
  toAppLanguage,
  type AppLanguage,
  type Dictionary,
} from './translations';

type I18n = {
  language: AppLanguage;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  t: Dictionary;
};

const I18nContext = createContext<I18n>({
  language: 'en',
  dir: 'ltr',
  isRTL: false,
  t: dictionaries.en,
});

/**
 * Interface language + text direction, driven by the account's preferredLanguage exactly like the
 * web I18nProvider: PR → Persian UI laid out right-to-left, everything else → English, LTR.
 *
 * The direction is applied with the `direction` style on a root View (not I18nManager.forceRTL),
 * so switching the language in Settings re-lays the whole app out immediately, without a restart.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const preferred = useAuthStore((s) => s.profile?.preferredLanguage);
  const language = toAppLanguage(preferred);
  const isRTL = isRtlLanguage(language);
  const dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    // Lets native widgets (text inputs, scroll views) that read the global flag allow RTL.
    I18nManager.allowRTL(true);
  }, []);

  const value = useMemo(
    () => ({ language, dir, isRTL, t: dictionaries[language] }) as I18n,
    [language, dir, isRTL],
  );

  return (
    <I18nContext.Provider value={value}>
      <View style={{ flex: 1, direction: dir }}>{children}</View>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  return useContext(I18nContext);
}
