"use client";

import { useRouter } from "next/navigation";
import { Check, MessageCircle, Sparkles, Wand2, Zap } from "lucide-react";
import { Card, CardContent } from "@/componenets/ui/card";
import Button from "@/componenets/Button";

const FEATURES: { icon: typeof Zap; title: string; basic: string; premium: string }[] = [
    { icon: MessageCircle, title: "AI Chat", basic: "5 messages / day", premium: "100 messages / day" },
    { icon: Check, title: "AI Correction", basic: "3 corrections / day", premium: "50 corrections / day" },
    { icon: Wand2, title: "AI Examples", basic: "5 examples / day", premium: "100 examples / day" },
    { icon: Sparkles, title: "AI Synonyms", basic: "5 lookups / day", premium: "100 lookups / day" },
];

/** Placeholder "go Premium" page. No checkout yet — account upgrades are granted by an admin
 * (see /admin) until payments are wired up; this page exists so the upsell modal has somewhere
 * to send users in the meantime. */
export default function PremiumPage() {
    const router = useRouter();

    return (
        <div className="px-6 py-10">
            <div className="max-w-4xl mx-auto text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="size-7 text-primary" />
                </div>
                <h1 className="mt-4 text-3xl font-bold text-foreground">Go Premium</h1>
                <p className="mt-2 text-foreground/60 max-w-lg mx-auto">
                    Unlock much higher daily limits on every AI-powered feature so you can chat, get
                    corrections, and practice as much as you want.
                </p>
            </div>

            <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FEATURES.map(({ icon: Icon, title, basic, premium }) => (
                    <Card key={title}>
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                                <Icon className="size-5 text-accent-foreground" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{title}</p>
                                <p className="text-sm text-foreground/50">
                                    {basic} <span className="mx-1">→</span>
                                    <span className="font-medium text-primary">{premium}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="max-w-4xl mx-auto mt-8">
                <CardContent className="p-6 text-center">
                    <p className="text-foreground/70">
                        Payments aren&apos;t open yet — for now, ask an admin to switch your account to
                        Premium while we finish building checkout.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                        <Button variant="secondary" onClick={() => router.back()}>
                            Back
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
