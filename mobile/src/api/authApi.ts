import type { ApiResponse, MobileAuthData, UserProfile } from '@/types/user';
import { api, request } from './client';

export type LoginInput = { email: string; password: string };
export type RegisterInput = { displayName: string; email: string; password: string };

// Auth endpoints are called without a bearer token and never trigger refresh handling.
export const authApi = {
  login: (input: LoginInput) =>
    request<ApiResponse<MobileAuthData>>('/auth/mobile/login', {
      method: 'POST',
      body: input,
      auth: false,
    }).then((r) => r.data),

  register: (input: RegisterInput) =>
    request<ApiResponse<MobileAuthData>>('/auth/mobile/register', {
      method: 'POST',
      body: input,
      auth: false,
    }).then((r) => r.data),

  google: (idToken: string) =>
    request<ApiResponse<MobileAuthData>>('/auth/mobile/google', {
      method: 'POST',
      body: { idToken },
      auth: false,
    }).then((r) => r.data),

  forgotPassword: (email: string) =>
    request<ApiResponse<null>>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    }).then((r) => r.message),

  getProfile: () => api.get<ApiResponse<UserProfile>>('/user/profile').then((r) => r.data),
};
