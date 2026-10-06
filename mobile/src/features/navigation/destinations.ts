import type { Href } from 'expo-router';

export type Destination = {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  href: Href;
};

export const LEARN_DESTINATIONS: Destination[] = [
  {
    key: 'daily-words',
    emoji: '🌱',
    title: 'Daily Words',
    subtitle: 'Deine 5 Wörter für heute',
    href: '/learn/daily-words',
  },
  {
    key: 'vocabulary',
    emoji: '📚',
    title: 'Vocabulary',
    subtitle: 'Wortschatz trainieren',
    href: '/learn/vocabulary',
  },
  {
    key: 'grammar',
    emoji: '🧩',
    title: 'Grammar',
    subtitle: 'Von A1 bis C1',
    href: '/learn/grammar',
  },
  {
    key: 'expressions',
    emoji: '💬',
    title: 'Active Expressions',
    subtitle: 'Redewendungen & Nomen-Verb-Verbindungen',
    href: '/learn/expressions',
  },
  {
    key: 'redemittel',
    emoji: '🗣️',
    title: 'Redemittel',
    subtitle: 'Ausdrücke für Schreiben & Sprechen',
    href: '/learn/redemittel',
  },
  {
    key: 'reading',
    emoji: '📖',
    title: 'Reading',
    subtitle: 'Texte lesen und verstehen',
    href: '/learn/reading',
  },
  {
    key: 'review',
    emoji: '🗂️',
    title: 'Review',
    subtitle: 'Gelerntes wiederholen',
    href: '/learn/review',
  },
];

export const PROFILE_DESTINATIONS: Destination[] = [
  {
    key: 'progress',
    emoji: '📈',
    title: 'Progress',
    subtitle: 'Dein Lernfortschritt',
    href: '/progress',
  },
  {
    key: 'achievements',
    emoji: '🏆',
    title: 'Erfolge',
    subtitle: 'Deine gesammelten Sterne',
    href: '/achievements',
  },
  {
    key: 'settings',
    emoji: '⚙️',
    title: 'Settings',
    subtitle: 'Sprache, Niveau, Tagesziel',
    href: '/settings',
  },
  {
    key: 'notifications',
    emoji: '🔔',
    title: 'Notifications',
    subtitle: 'Erinnerungen verwalten',
    href: '/settings/notifications',
  },
  {
    key: 'account',
    emoji: '👤',
    title: 'Account',
    subtitle: 'Profil und Passwort',
    href: '/settings/account',
  },
];
