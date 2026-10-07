import { useMutation } from '@tanstack/react-query';
import { authApi, type LoginInput, type RegisterInput } from '@/api/authApi';
import { requestGoogleIdToken } from './google';
import { useI18n } from '@/i18n';
import { useAuthStore } from '@/stores/authStore';

// On success the store flips to "authenticated" and the root route guard swaps the stack.
export function useLogin() {
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    mutationFn: async (input: LoginInput) => signIn(await authApi.login(input)),
  });
}

export function useRegister() {
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    mutationFn: async (input: RegisterInput) => signIn(await authApi.register(input)),
  });
}

export function useGoogleLogin() {
  const signIn = useAuthStore((s) => s.signIn);
  const { t } = useI18n();
  return useMutation({
    mutationFn: async () => {
      const idToken = await requestGoogleIdToken(t.entry.auth.google);
      if (idToken) await signIn(await authApi.google(idToken));
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (email: string) => authApi.forgotPassword(email) });
}
