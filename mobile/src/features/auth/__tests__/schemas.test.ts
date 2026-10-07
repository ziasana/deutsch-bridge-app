import { dictionaries } from '@/i18n';
import { createAuthSchemas } from '../schemas';

const en = dictionaries.en.entry.auth.errors;
const fa = dictionaries.fa.entry.auth.errors;
const { loginSchema, forgotPasswordSchema, nameSchema, passwordSchema } = createAuthSchemas(en);

describe('auth schemas', () => {
  it('rejects invalid login input with messages in the interface language', () => {
    const r = loginSchema.safeParse({ email: 'nope', password: '' });
    expect(r.success).toBe(false);
    const messages = r.error?.issues.map((i) => i.message);
    expect(messages).toContain(en.emailInvalid);
    expect(messages).toContain(en.passwordRequired);

    const persian = createAuthSchemas(fa).loginSchema.safeParse({ email: '', password: 'x' });
    expect(persian.error?.issues[0].message).toBe(fa.emailRequired);
  });

  it('trims email and accepts valid login', () => {
    const r = loginSchema.safeParse({ email: ' a@b.de ', password: 'x' });
    expect(r.success && r.data.email).toBe('a@b.de');
  });

  it('enforces the backend registration rules (name 3–30, password ≥ 6)', () => {
    expect(nameSchema.safeParse('Ali').success).toBe(true);
    expect(nameSchema.safeParse('Al').success).toBe(false);
    expect(nameSchema.safeParse('x'.repeat(31)).success).toBe(false);
    expect(passwordSchema.safeParse('secret1').success).toBe(true);
    expect(passwordSchema.safeParse('12345').success).toBe(false);
  });

  it('validates the forgot-password email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.de' }).success).toBe(true);
  });
});
