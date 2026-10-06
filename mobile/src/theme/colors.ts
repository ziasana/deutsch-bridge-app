// Mirrors the web design tokens in frontend/app/globals.css (light theme).
export const colors = {
  background: '#F7F9FC', // hsl(220 50% 98%)
  surface: '#FFFFFF', // --card
  foreground: '#1D2433', // hsl(224 27% 15%)
  mutedForeground: '#687083', // hsl(222 12% 46%)
  primary: '#4D94FF', // hsl(216 100% 62%)
  brand: '#3F86F0', // splash + welcome surfaces: white text on it stays legible at 3.7:1+
  primaryDark: '#2F6FDB', // pressed / text-on-light variant with AA contrast
  primaryForeground: '#FFFFFF',
  accent: '#E9F2FF', // hsl(216 100% 96%)
  secondary: '#EBF0F8', // hsl(216 45% 95%)
  muted: '#F1F3F7', // hsl(220 25% 95%)
  border: '#E4E8EF', // hsl(220 20% 91%)
  success: '#27AE7A', // chart-3
  successSoft: '#E4F6EE',
  warning: '#D98E04',
  warningSoft: '#FDF3DC',
  destructive: '#EF4444',
  destructiveSoft: '#FDE8E8',
} as const;

export type ColorToken = keyof typeof colors;
