import { forgotPasswordSchema, loginSchema, registerSchema } from '../schemas';

describe('auth schemas', () => {
  it('rejects invalid login input with German messages', () => {
    const r = loginSchema.safeParse({ email: 'nope', password: '' });
    expect(r.success).toBe(false);
    const messages = r.error?.issues.map((i) => i.message);
    expect(messages).toContain('Bitte gib eine gültige E-Mail-Adresse ein.');
    expect(messages).toContain('Bitte gib dein Passwort ein.');
  });

  it('trims email and accepts valid login', () => {
    const r = loginSchema.safeParse({ email: ' a@b.de ', password: 'x' });
    expect(r.success && r.data.email).toBe('a@b.de');
  });

  it('enforces the backend registration rules (name 3–30, password ≥ 6, match)', () => {
    const base = {
      displayName: 'Ali',
      email: 'a@b.de',
      password: 'secret1',
      passwordConfirmation: 'secret1',
    };
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, displayName: 'Al' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, displayName: 'x'.repeat(31) }).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: '12345', passwordConfirmation: '12345' })
        .success,
    ).toBe(false);
    const mismatch = registerSchema.safeParse({ ...base, passwordConfirmation: 'other' });
    expect(mismatch.error?.issues[0].path).toEqual(['passwordConfirmation']);
  });

  it('validates the forgot-password email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.de' }).success).toBe(true);
  });
});
