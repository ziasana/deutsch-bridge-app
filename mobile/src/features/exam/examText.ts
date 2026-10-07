import { useCallback } from 'react';
import { useI18n, type AppLanguage } from '@/i18n';

/**
 * The exam backend only knows German. Its section names, "Teil N", task-type names and the
 * "3. Übung" numbering are fixed vocabulary, so English and Persian learners get them translated here.
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

/** English names of the same fixed vocabulary (telc / Goethe style). Same ordering rule as above. */
const EN_TERMS: [string, string][] = [
  ['Zuordnung: Situation → Anzeige', 'Matching: situation → advert'],
  ['Aufgaben richtig/falsch/nicht', 'True / false / not stated tasks'],
  ['Lückentext (Wortbank)', 'Gap text (word bank)'],
  ['Multiple-Choice-Aufgaben', 'Multiple-choice tasks'],
  ['Schriftlicher Ausdruck', 'Written expression'],
  ['Zuordnungsaufgaben', 'Matching tasks'],
  ['Hörverstehen', 'Listening'],
  ['Leseverstehen', 'Reading comprehension'],
  ['Sprachbausteine', 'Language elements'],
  ['Schreibaufgaben', 'Writing tasks'],
  ['Testformat', 'Test format'],
  ['Schreiben', 'Writing'],
  ['Übungen', 'Exercises'],
  ['Lesen', 'Reading'],
  ['Hören', 'Listening'],
  ['Teil', 'Part'],
];

const LETTER = '\\p{L}';

function patternsFor(
  terms: [string, string][],
  exercise: string,
  numbered: string,
): [RegExp, string][] {
  return [
    // "3. Übung" → "تمرین 3" / "Exercise 3" (numbering reads naturally after the noun)
    [/(\d+)\.\s*Übung(?![\p{L}])/gu, `${numbered} $1`],
    ...terms.map(
      ([de, translated]) =>
        [
          new RegExp(
            `(?<!${LETTER})${de.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!${LETTER})`,
            'gu',
          ),
          translated,
        ] as [RegExp, string],
    ),
    [/(?<![\p{L}])Übung(?![\p{L}])/gu, exercise],
  ];
}

const PATTERNS: Record<AppLanguage, [RegExp, string][]> = {
  fa: patternsFor(FA_TERMS, 'تمرین', 'تمرین'),
  en: patternsFor(EN_TERMS, 'Exercise', 'Exercise'),
};

/** Translates the fixed German exam vocabulary in `text` for the given interface language. */
export function localizeExamText(text: string, language: AppLanguage): string {
  if (!text) return text;
  return PATTERNS[language].reduce(
    (acc, [pattern, translated]) => acc.replace(pattern, translated),
    text,
  );
}

/** `tx("Teil 1 – Zuordnungsaufgaben")` → the learner's language (German names are translated for English and Persian). */
export function useExamText() {
  const { language } = useI18n();
  return useCallback((text: string) => localizeExamText(text, language), [language]);
}
