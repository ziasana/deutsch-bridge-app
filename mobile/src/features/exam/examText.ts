import { useCallback } from 'react';
import { useI18n, type AppLanguage } from '@/i18n';

/**
 * The exam backend only knows German. Its section names, "Teil N", task-type names and the
 * "3. Übung" numbering are fixed vocabulary, so Persian learners get them translated here.
 * Free-text titles that have no entry (e.g. "E-Mail an den Vermieter") stay German.
 * Longest terms first, so "Schriftlicher Ausdruck" wins over "Schreiben" and so on.
 */
const FA_TERMS: [string, string][] = [
  ['Zuordnung: Situation → Anzeige', 'تطبیق: موقعیت ← آگهی'],
  ['Aufgaben richtig/falsch/nicht', 'تکالیف درست/نادرست/ذکر نشده'],
  ['Lückentext (Wortbank)', 'متن با جای خالی (بانک واژه)'],
  ['Multiple-Choice-Aufgaben', 'تکالیف چندگزینه‌ای'],
  ['Schriftlicher Ausdruck', 'بیان نوشتاری'],
  ['Zuordnungsaufgaben', 'تکالیف تطبیق'],
  ['Hörverstehen', 'درک مطلب شنیداری'],
  ['Leseverstehen', 'درک مطلب خواندن'],
  ['Sprachbausteine', 'عناصر زبانی'],
  ['Schreibaufgaben', 'تکالیف نوشتاری'],
  ['Testformat', 'قالب آزمون'],
  ['Schreiben', 'نوشتن'],
  ['Übungen', 'تمرین‌ها'],
  ['Lesen', 'خواندن'],
  ['Hören', 'شنیدن'],
  ['Teil', 'بخش'],
];

const LETTER = '\\p{L}';
const FA_PATTERNS: [RegExp, string][] = [
  // "3. Übung" → "تمرین 3" (numbering reads naturally in Persian)
  [/(\d+)\.\s*Übung(?![\p{L}])/gu, 'تمرین $1'],
  ...FA_TERMS.map(
    ([de, fa]) =>
      [
        new RegExp(`(?<!${LETTER})${de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!${LETTER})`, 'gu'),
        fa,
      ] as [RegExp, string],
  ),
  [/(?<![\p{L}])Übung(?![\p{L}])/gu, 'تمرین'],
];

/** Translates the fixed German exam vocabulary in `text` for the given interface language. */
export function localizeExamText(text: string, language: AppLanguage): string {
  if (language !== 'fa' || !text) return text;
  return FA_PATTERNS.reduce((acc, [pattern, fa]) => acc.replace(pattern, fa), text);
}

/** `tx("Teil 1 – Zuordnungsaufgaben")` → the learner's language (German stays German for English). */
export function useExamText() {
  const { language } = useI18n();
  return useCallback((text: string) => localizeExamText(text, language), [language]);
}
