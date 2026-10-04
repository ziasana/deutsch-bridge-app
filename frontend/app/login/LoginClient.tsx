"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import FieldMessage from "@/componenets/FieldMessage";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import Loading from "@/componenets/Loading";
import GoogleSignInButton from "@/componenets/GoogleSignInButton";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { loginUser } from "@/services/userService";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/schema/loginSchema";
import { useForm } from "react-hook-form";

export default function LoginClient() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get("success")) {
            toast.success(
                "Registration completed successfully. Now you can log in."
            );
        }
    }, [searchParams]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onSubmit",
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);

        loginUser(data)
            .then((res) => {
                if (res?.status === 200) {
                    const profile = res.data.data;
                    login(profile);
                    if (profile?.role === "ADMIN") {
                        router.push("/admin");
                    } else if (!profile?.onboardingCompleted) {
                        router.push("/signup/onboarding");
                    } else {
                        router.push("/dashboard");
                    }
                }
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message ?? "Login failed. Please check your credentials.");
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden flex items-center justify-center bg-gradient-to-b from-accent/60 to-background px-4 py-12">
            <div
                aria-hidden
                className="absolute -right-10 -top-10 size-40 opacity-40 [background-image:radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:12px_12px]"
            />
            <div
                aria-hidden
                className="absolute -left-10 bottom-0 size-40 opacity-40 [background-image:radial-gradient(var(--border)_1.5px,transparent_1.5px)] [background-size:12px_12px]"
            />

            <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-card p-8 sm:p-12">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight text-foreground mb-3">
                    Welcome back!
                </h1>
                <p className="text-lg text-foreground/70 mb-8">
                    Hey there! Ready to continue learning? Enter your email and password below and you&#39;ll be back to studying in no time.
                </p>

                {isLoading && <Loading />}

                <GoogleSignInButton onLoadingChange={setIsLoading} />

                <div className="flex items-center gap-4 my-6">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-sm text-foreground/50">or</span>
                    <span className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                    <div>
                        <label className="block text-foreground font-semibold mb-2 text-sm">
                            Email
                        </label>
                        <Input
                            type="text"
                            {...register("email")}
                            placeholder="Email"
                            autoComplete="email"
                            aria-invalid={!!errors.email}
                            aria-describedby="login-email-msg"
                        />
                        <FieldMessage id="login-email-msg" error={errors.email?.message} hint="Use the email you registered with." />
                    </div>

                    <div>
                        <label className="block text-foreground font-semibold mb-2 text-sm">
                            Password
                        </label>
                        <Input
                            type="password"
                            {...register("password")}
                            placeholder="Password"
                            autoComplete="current-password"
                            aria-invalid={!!errors.password}
                            aria-describedby="login-password-msg"
                        />
                        <FieldMessage id="login-password-msg" error={errors.password?.message} hint="At least 6 characters." />
                    </div>

                    <div className="flex justify-end">
                        <Link
                            href="/reset-password"
                            className="text-sm font-semibold text-primary hover:underline"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <Button
                        variant="primary"
                        type="submit"
                        className="w-full rounded-full py-3.5 flex items-center justify-center gap-2"
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                        {!isLoading && <ArrowRight className="size-4" />}
                    </Button>
                </form>

                <div className="mt-8 text-center text-foreground/60">
                    Don&#39;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="text-primary font-semibold hover:underline"
                    >
                        Sign Up
                    </Link>
                </div>
            </div>
        </div>
    );
}
