import type { DashboardResponse } from '@/types/dashboard';
import { api } from './client';

export const dashboardApi = {
  // One aggregated call: the backend decides what to continue, today's plan, review and focus.
  get: () => api.get<DashboardResponse>('/dashboard'),
};
