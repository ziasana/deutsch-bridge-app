import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { ExamKind, Focus, Level, Reason } from './plan';
import type { PreferredLanguage } from '@/types/user';

type IconName = ComponentProps<typeof Ionicons>['name'];
export type Option<T> = {
  value: T;
  label: string;
  description?: string;
  icon?: IconName;
  emoji?: string;
};

export const LANGUAGE_OPTIONS: Option<PreferredLanguage>[] = [
  {
    value: 'EN',
    label: 'English',
    description: 'Deutsche Erklärungen mit englischer Unterstützung',
    emoji: '🇬🇧',
  },
  { value: 'PR', label: 'فارسی', description: 'توضیحات و ترجمه‌های آلمانی به فارسی', emoji: '🇮🇷' },
];

export const REASON_OPTIONS: Option<Reason>[] = [
  {
    value: 'WORK',
    label: 'Beruf & Karriere',
    description: 'Mein Deutsch im Job verbessern',
    icon: 'briefcase-outline',
  },
  {
    value: 'EVERYDAY_LIFE',
    label: 'Alltag',
    description: 'Im Alltag sicherer kommunizieren',
    icon: 'home-outline',
  },
  {
    value: 'STUDY',
    label: 'Studium',
    description: 'Auf ein Studium auf Deutsch vorbereiten',
    icon: 'school-outline',
  },
  {
    value: 'COMMUNICATION',
    label: 'Kommunikation',
    description: 'Besser sprechen und verstehen',
    icon: 'chatbubbles-outline',
  },
  {
    value: 'EXAM',
    label: 'Prüfungsvorbereitung',
    description: 'Auf eine Deutschprüfung lernen',
    icon: 'ribbon-outline',
  },
  {
    value: 'LIVING_IN_GERMANY',
    label: 'Leben in Deutschland',
    description: 'Mich in Deutschland wohler fühlen',
    icon: 'location-outline',
  },
  {
    value: 'PERSONAL_INTEREST',
    label: 'Persönliches Interesse',
    description: 'Ich lerne einfach gern Deutsch',
    icon: 'heart-outline',
  },
];

export const LEVEL_OPTIONS: Option<Level>[] = [
  { value: 'A1', label: 'A1 · Anfänger', description: 'Ich kenne einfache Wörter und Sätze.' },
  {
    value: 'A2',
    label: 'A2 · Grundlagen',
    description: 'Ich komme in vertrauten Alltagssituationen zurecht.',
  },
  {
    value: 'B1',
    label: 'B1 · Mittelstufe',
    description: 'Ich kann viele Alltagsgespräche führen.',
  },
  {
    value: 'B2',
    label: 'B2 · Gute Mittelstufe',
    description: 'Ich kann über komplexe Themen sprechen.',
  },
  { value: 'C1', label: 'C1 · Fortgeschritten', description: 'Ich drücke mich fließend aus.' },
  {
    value: 'C2',
    label: 'C2 · Experte',
    description: 'Ich verstehe fast alles und formuliere präzise.',
  },
];

export const FOCUS_OPTIONS: Option<Focus>[] = [
  {
    value: 'VOCABULARY',
    label: 'Wortschatz',
    description: 'Mehr Wörter lernen und behalten',
    icon: 'book-outline',
  },
  {
    value: 'GRAMMAR',
    label: 'Grammatik',
    description: 'Sicherer im Satzbau werden',
    icon: 'extension-puzzle-outline',
  },
  {
    value: 'SPEAKING',
    label: 'Sprechen',
    description: 'Mich selbstbewusster ausdrücken',
    icon: 'mic-outline',
  },
  {
    value: 'LISTENING',
    label: 'Hören',
    description: 'Gesprochenes Deutsch besser verstehen',
    icon: 'ear-outline',
  },
  {
    value: 'READING',
    label: 'Lesen',
    description: 'Texte leichter verstehen',
    icon: 'reader-outline',
  },
  {
    value: 'WRITING',
    label: 'Schreiben',
    description: 'Klarer und korrekter schreiben',
    icon: 'create-outline',
  },
  {
    value: 'EXPRESSIONS',
    label: 'Redewendungen',
    description: 'Natürliche Ausdrücke lernen',
    icon: 'chatbox-ellipses-outline',
  },
  {
    value: 'EXAM',
    label: 'Prüfungsfertigkeiten',
    description: 'Prüfungsaufgaben üben',
    icon: 'clipboard-outline',
  },
];

export const EXAM_OPTIONS: Option<ExamKind>[] = [
  { value: 'TELC', label: 'TELC' },
  { value: 'GOETHE', label: 'Goethe' },
  { value: 'TESTDAF', label: 'TestDaF' },
  { value: 'DSH', label: 'DSH' },
  { value: 'OTHER', label: 'Sonstige' },
];

export const DAILY_WORD_OPTIONS: Option<number>[] = [
  { value: 5, label: '5 Wörter', description: 'Entspannt' },
  { value: 10, label: '10 Wörter', description: 'Ausgewogen' },
  { value: 15, label: '15 Wörter', description: 'Fokussiert' },
  { value: 20, label: '20 Wörter', description: 'Intensiv' },
];
