"use client";

import { useRouter } from "next/navigation";
import { Sparkles, X, Zap } from "lucide-react";
import usePremiumUpsellStore from "@/store/usePremiumUpsellStore";

const PERKS = [
    "20x higher daily limits on AI Chat, Corrections, Examples & Synonyms",
    "Priority access during peak hours",
    "Support the app's continued development",
];

/** Global modal shown whenever a gated AI feature call hits its daily limit (HTTP 429).
 * Mounted once in the root layout and driven by usePremiumUpsellStore, so it appears no matter
 * which page triggered the limit. */
export default function PremiumUpsellModal() {
    const { isOpen, message, close } = usePremiumUpsellStore();
    const router = useRouter();

    if (!isOpen) return null;

    const goToPremium = () => {
        close();
        router.push("/premium");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="relative w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
                <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="absolute right-4 top-4 text-foreground/40 transition hover:text-foreground"
                >
                    <X className="size-5" />
                </button>

                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="size-6 text-primary" />
                </div>

                <h2 className="mt-4 text-lg font-semibold text-foreground">Daily limit reached</h2>
                <p className="mt-1 text-sm text-foreground/60">
                    {message ?? "You've used up today's free AI requests for this feature."}
                </p>

                <div className="mt-4 rounded-xl bg-accent/50 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <Sparkles className="size-4 text-primary" /> With Premium you get:
                    </p>
                    <ul className="mt-2 space-y-1.5">
                        {PERKS.map((perk) => (
                            <li key={perk} className="text-sm text-foreground/70">
                                • {perk}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={close}
                        className="flex-1 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
                    >
                        Maybe later
                    </button>
                    <button
                        type="button"
                        onClick={goToPremium}
                        className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                        Upgrade to Premium
                    </button>
                </div>
            </div>
        </div>
    );
}
