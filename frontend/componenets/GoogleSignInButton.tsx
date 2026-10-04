"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { googleLogin } from "@/services/userService";
import useAuthStore from "@/store/useAuthStore";
import { toast } from "@/lib/toast";

interface Props {
    text?: "continue_with" | "signin_with" | "signup_with";
    onLoadingChange?: (loading: boolean) => void;
}

/** Google's own sign-in button; the same flow logs in an existing learner or creates a new account. */
export default function GoogleSignInButton({ text = "continue_with", onLoadingChange }: Readonly<Props>) {
    const router = useRouter();
    const { login } = useAuthStore();

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        return null;
    }

    const handleCredential = async (idToken?: string) => {
        if (!idToken) {
            toast.error("Google sign-in failed. Please try again.");
            return;
        }
        onLoadingChange?.(true);
        try {
            const res = await googleLogin(idToken);
            const profile = res.data.data;
            login(profile);
            if (profile?.role === "ADMIN") {
                router.push("/admin");
            } else if (!profile?.onboardingCompleted) {
                router.push("/signup/onboarding");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message ?? "Google sign-in failed. Please try again.");
        } finally {
            onLoadingChange?.(false);
        }
    };

    return (
        <div className="flex justify-center">
            <GoogleLogin
                onSuccess={(r) => handleCredential(r.credential)}
                onError={() => toast.error("Google sign-in failed. Please try again.")}
                text={text}
                shape="pill"
                size="large"
                width="320"
                logo_alignment="center"
            />
        </div>
    );
}
