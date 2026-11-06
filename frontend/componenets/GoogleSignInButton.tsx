"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { googleLogin } from "@/services/userService";
import { toast } from "@/lib/toast";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

interface GoogleId {
    initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void; ux_mode?: string }) => void;
    renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}
declare global {
    interface Window {
        google?: { accounts: { id: GoogleId } };
    }
}

let gsiLoading: Promise<void> | null = null;
function loadGsi(): Promise<void> {
    if (window.google?.accounts?.id) return Promise.resolve();
    gsiLoading ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = GSI_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            gsiLoading = null;
            reject(new Error("Google script failed to load"));
        };
        document.head.appendChild(script);
    });
    return gsiLoading;
}

/**
 * "Continue with Google" for login and signup alike: Google's own button returns an ID token, the backend
 * verifies it and signs the learner in (creating the account on first use), then we route like a normal login.
 */
export default function GoogleSignInButton({ text = "continue_with" }: Readonly<{ text?: "signin_with" | "signup_with" | "continue_with" }>) {
    const router = useRouter();
    const { login } = useAuthStore();
    const holder = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!CLIENT_ID || !holder.current) return;
        let cancelled = false;
        const parent = holder.current;
        loadGsi()
            .then(() => {
                if (cancelled || !window.google) return;
                window.google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: async ({ credential }) => {
                        if (!credential) return;
                        try {
                            const res = await googleLogin(credential);
                            const profile = res.data.data;
                            login(profile);
                            if (profile?.role === "ADMIN") router.push("/admin");
                            else if (!profile?.onboardingCompleted) router.push("/signup/onboarding");
                            else router.push("/dashboard");
                        } catch (err) {
                            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
                            toast.error(message ?? "Google sign-in failed. Please try again.");
                        }
                    },
                });
                window.google.accounts.id.renderButton(parent, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    shape: "pill",
                    text,
                    logo_alignment: "left",
                    // Google only accepts a pixel width between 200 and 400.
                    width: Math.min(400, Math.max(200, Math.round(parent.clientWidth))),
                });
            })
            .catch(() => !cancelled && setFailed(true));
        return () => {
            cancelled = true;
        };
    }, [login, router, text]);

    if (!CLIENT_ID || failed) {
        return (
            <button
                type="button"
                onClick={() => toast.info(failed ? "Couldn't reach Google. Check your connection and try again." : "Google sign-in isn't available yet.")}
                className="w-full flex items-center justify-center gap-3 rounded-full border border-border bg-card py-3 font-semibold text-foreground hover:bg-accent transition-all"
            >
                Continue with Google
            </button>
        );
    }

    // color-scheme keeps Google's iframe opaque in dark mode.
    return <div ref={holder} className="flex min-h-[44px] w-full justify-center" style={{ colorScheme: "light" }} />;
}
