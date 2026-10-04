"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Crown, FileText, MessageCircle, Rocket, X } from "lucide-react";
import usePremiumUpsellStore from "@/store/usePremiumUpsellStore";
import { useI18n } from "@/componenets/I18nProvider";

/** Global modal shown whenever a gated AI feature call hits its daily limit (HTTP 429).
 * Mounted once in the root layout and driven by usePremiumUpsellStore, so it appears no matter
 * which page triggered the limit. */
export default function PremiumUpsellModal() {
    const { isOpen, close } = usePremiumUpsellStore();
    const router = useRouter();
    const { t } = useI18n();

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, close]);

    if (!isOpen) return null;

    const goToPremium = () => {
        close();
        router.push("/premium");
    };

    const perks = [
        { icon: MessageCircle, title: t.upsell.perkLimits, hint: t.upsell.perkLimitsHint },
        { icon: FileText, title: t.upsell.perkFeedback, hint: t.upsell.perkFeedbackHint },
        { icon: Rocket, title: t.upsell.perkPriority, hint: t.upsell.perkPriorityHint },
    ];

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={close}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="premium-upsell-title"
                className="anim-pop relative w-full max-w-md overflow-hidden rounded-[10px] bg-card shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="absolute end-3 top-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full text-foreground/50 transition hover:bg-foreground/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <X className="size-4" aria-hidden="true" />
                </button>

                <div className="bg-gradient-to-b from-primary/15 via-primary/5 to-transparent px-6 pb-2 pt-8 text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-8 ring-primary/10">
                        <Crown className="size-7" aria-hidden="true" />
                    </div>
                    <span className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {t.upsell.badge}
                    </span>
                    <h2 id="premium-upsell-title" className="mt-3 text-xl font-bold text-foreground">
                        {t.upsell.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">{t.upsell.subtitle}</p>
                </div>

                <div className="px-6 pb-6 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{t.upsell.perksTitle}</p>
                    <ul className="mt-3 space-y-2.5">
                        {perks.map(({ icon: Icon, title, hint }) => (
                            <li key={title} className="flex items-center gap-3 rounded-[10px] bg-foreground/[0.04] px-3.5 py-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                    <Icon className="size-4 text-primary" aria-hidden="true" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">{title}</p>
                                    <p className="text-xs text-foreground/55">{hint}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={close}
                            className="flex-1 cursor-pointer rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            {t.upsell.later}
                        </button>
                        <button
                            type="button"
                            onClick={goToPremium}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        >
                            <Crown className="size-4" aria-hidden="true" />
                            {t.upsell.upgrade}
                        </button>
                    </div>
                    <p className="mt-3 text-center text-xs text-foreground/50">{t.upsell.resetNote}</p>
                </div>
            </div>
        </div>,
        document.body,
    );
}
