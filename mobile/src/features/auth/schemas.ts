import { z } from 'zod';
import type { Dictionary } from '@/i18n';

type Messages = Dictionary['entry']['auth']['errors'];

/** The auth form schemas, with validation messages in the current interface language. */
export function createAuthSchemas(m: Messages) {
  const email = z.string().trim().min(1, m.emailRequired).pipe(z.email(m.emailInvalid));

  // Single-field schemas used by the step-by-step registration.
  const nameSchema = z.string().trim().min(3, m.nameMin).max(30, m.nameMax);
  const passwordSchema = z.string().min(6, m.passwordMin);

  const loginSchema = z.object({ email, password: z.string().min(1, m.passwordRequired) });
  const forgotPasswordSchema = z.object({ email });

  return { emailSchema: email, nameSchema, passwordSchema, loginSchema, forgotPasswordSchema };
}

export type LoginForm = { email: string; password: string };
export type ForgotPasswordForm = { email: string };
