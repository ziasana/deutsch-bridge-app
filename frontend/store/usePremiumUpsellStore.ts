import { create } from "zustand";

interface PremiumUpsellState {
    isOpen: boolean;
    message: string | null;
    open: (message?: string) => void;
    close: () => void;
}

/** Drives the global "daily limit reached" upsell modal, opened centrally from the axios
 * interceptor whenever an AI feature call comes back 429, so no individual page has to know
 * about entitlements. */
const usePremiumUpsellStore = create<PremiumUpsellState>((set) => ({
    isOpen: false,
    message: null,
    open: (message) => set({ isOpen: true, message: message ?? null }),
    close: () => set({ isOpen: false }),
}));

export default usePremiumUpsellStore;
