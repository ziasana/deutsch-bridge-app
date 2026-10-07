import { colors } from '@/theme';

export type Strength = { score: 0 | 1 | 2 | 3 | 4; color: string };

const COLORS = [
  colors.destructive,
  colors.destructive,
  colors.warning,
  colors.success,
  colors.success,
];

/** Rough, offline strength estimate: length plus character variety. Not a security check. */
export function passwordStrength(password: string): Strength {
  if (password.length < 6) return { score: 0, color: COLORS[0] };
  let points = 1;
  if (password.length >= 10) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;
  const score = Math.min(4, Math.max(1, points - 1)) as Strength['score'];
  return { score, color: COLORS[score] };
}
