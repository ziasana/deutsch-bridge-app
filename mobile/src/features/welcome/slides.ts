export type Slide = { key: string; title: string; subtitle: string };

/** Keys of the three pitch slides; their copy lives in the i18n dictionary (entry.welcome.slides). */
export const SLIDE_KEYS = ['learn', 'tutor', 'exam'] as const;
