import { colors } from '@/theme';

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string };

const LEVELS: Omit<Strength, 'score'>[] = [
  { label: 'Zu kurz', color: colors.destructive },
  { label: 'Schwach', color: colors.destructive },
  { label: 'Mittel', color: colors.warning },
  { label: 'Stark', color: colors.success },
  { label: 'Sehr stark', color: colors.success },
];

/** Rough, offline strength estimate: length plus character variety. Not a security check. */
export function passwordStrength(password: string): Strength {
  if (password.length < 6) return { score: 0, ...LEVELS[0] };
  let points = 1;
  if (password.length >= 10) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  const score = Math.min(4, Math.max(1, points - 1)) as Strength['score'];
  return { score, ...LEVELS[score] };
}

export const strengthHint = (password: string) =>
  password ? `Passwortstärke: ${passwordStrength(password).label}` : undefined;
