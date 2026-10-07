import { create } from 'zustand';

type PremiumUpsellState = {
  isOpen: boolean;
  message: string | null;
  open: (message?: string) => void;
  close: () => void;
};

/**
 * Drives the global "daily limit reached" upsell. Opened centrally from the API client whenever a
 * gated AI feature answers 429 (same as the web app's axios interceptor), so no screen has to
 * know about entitlements.
 */
export const usePremiumUpsellStore = create<PremiumUpsellState>((set) => ({
  isOpen: false,
  message: null,
  open: (message) => set({ isOpen: true, message: message ?? null }),
  close: () => set({ isOpen: false }),
}));
