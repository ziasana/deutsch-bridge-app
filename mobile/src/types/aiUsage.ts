export type AiFeature = 'AI_CHAT' | 'AI_CORRECTION' | 'AI_WRITING_FEEDBACK' | 'AI_EXAMPLE' | 'AI_SYNONYM';

export interface AiFeatureUsage {
  limit: number;
  used: number;
  remaining: number;
  enabled: boolean;
}

/** `enforced` is false while the backend's Premium switch is off: no limits, so no counter. */
export interface AiUsage {
  enforced: boolean;
  features: Partial<Record<AiFeature, AiFeatureUsage>>;
}
