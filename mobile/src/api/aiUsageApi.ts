import type { AiUsage } from '@/types/aiUsage';
import { api } from './client';

export const aiUsageApi = {
  today: () => api.get<AiUsage>('/ai-usage'),
};
