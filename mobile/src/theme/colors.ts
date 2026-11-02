// Mirrors the DeutschCertify brand tokens in frontend/app/globals.css (light theme).
// Deep Navy #16324F is the brand foundation; teal, amber and bright blue are accents.
export const colors = {
  background: '#F6F8FC',
  surface: '#FFFFFF', // --card
  foreground: '#253449',
  mutedForeground: '#64748B',
  primary: '#16324F',
  ink: '#253449',
  brand: '#16324F',
  primaryDark: '#0F2438',
  primaryForeground: '#FFFFFF',
  accent: '#eaf3f1',
  secondary: '#EEF3F8', // hsl(216 45% 95%)
  muted: '#EFF3F8', // hsl(220 25% 95%)
  border: '#E1E7EF',
  success: '#527C91',
  successSoft: '#E6EEF2',
  warning: '#c98a12',
  warningSoft: '#FDF3DC',
  destructive: '#DC4545',
  destructiveSoft: '#FDE8E8',
} as const;

export type ColorToken = keyof typeof colors;
