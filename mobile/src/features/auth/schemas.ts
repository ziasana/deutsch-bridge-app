import { z } from 'zod';

const email = z
  .string()
  .trim()
  .min(1, 'Bitte gib deine E-Mail-Adresse ein.')
  .pipe(z.email('Bitte gib eine gültige E-Mail-Adresse ein.'));

// Single-field schemas used by the step-by-step registration.
export const nameSchema = z
  .string()
  .trim()
  .min(3, 'Der Name muss mindestens 3 Zeichen lang sein.')
  .max(30, 'Der Name darf höchstens 30 Zeichen lang sein.');
export const emailSchema = email;
export const passwordSchema = z.string().min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Bitte gib dein Passwort ein.'),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(3, 'Der Name muss mindestens 3 Zeichen lang sein.')
      .max(30, 'Der Name darf höchstens 30 Zeichen lang sein.'),
    email,
    password: z.string().min(6, 'Das Passwort muss mindestens 6 Zeichen lang sein.'),
    passwordConfirmation: z.string().min(1, 'Bitte bestätige dein Passwort.'),
  })
  .refine((v) => v.password === v.passwordConfirmation, {
    message: 'Die Passwörter stimmen nicht überein.',
    path: ['passwordConfirmation'],
  });

export const forgotPasswordSchema = z.object({ email });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
