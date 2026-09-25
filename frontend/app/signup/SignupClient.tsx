"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {useEffect, useState} from "react";
import {registerUser} from "@/services/userService";
import { toast } from "@/lib/toast";
import Loading from "@/componenets/Loading";
import {useRouter, useSearchParams} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {signupSchema, SignupSchemaFormData} from "@/schema/signupSchema"
import {useFormErrorToast} from "@/hook/useFormErrorToast";
import useAuthStore from "@/store/useAuthStore";

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { login } = useAuthStore();

    useEffect(() => {
        if(searchParams.get("error"))
            toast.error("Confirmation link expired! please register again! ");
    },[router, searchParams]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitted },
    } = useForm<SignupSchemaFormData>({
        resolver: zodResolver(signupSchema),
        mode: "onSubmit", // validate on submit
    });


    const onSubmit = async (data: SignupSchemaFormData) => {
        setIsLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password_confirmation, ...newUser } = data; // remove confirmPassword
        registerUser(newUser)
            .then((res) => {
                if (res?.status === 201) {
                    const profile = res.data.data;
                    login(profile);
                    reset();
                    router.push(profile?.onboardingCompleted ? "/dashboard" : "/signup/onboarding");
                }
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message ?? "Registration failed. Please try again.")
                console.error(err)
            })
            .finally(() => setIsLoading(false));
    };
    useFormErrorToast(errors, isSubmitted);

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
                    Create your account
                </h1>
                <p className="text-lg text-foreground/70 mb-8">
                    Join thousands of learners mastering German with DeutschBridge. It only takes a minute to get started.
                </p>

                {isLoading && <Loading message="Please wait..." />}

                <button
                    type="button"
                    onClick={() => toast.info("Google sign-in is coming soon.")}
                    className="w-full flex items-center justify-center gap-3 rounded-full border border-border bg-card py-3 font-semibold text-foreground hover:bg-accent hover:-translate-y-0.5 hover:shadow-md transition-all"
                >
                    <GoogleIcon className="size-4" />
                    Continue with Google
                </button>

                <div className="flex items-center gap-4 my-6">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-sm text-foreground/50">or</span>
                    <span className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-foreground font-semibold mb-2 text-sm">
                                Full Name
                            </label>
                            <Input type="text" {...register("displayName")} placeholder="Full name" />
                        </div>

                        <div>
                            <label className="block text-foreground font-semibold mb-2 text-sm">
                                Username
                            </label>
                            <Input type="text" {...register("username")} placeholder="Username" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-foreground font-semibold mb-2 text-sm">
                            Email
                        </label>
                        <Input type="email" {...register("email")} placeholder="Email" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-foreground font-semibold mb-2 text-sm">
                                Password
                            </label>
                            <Input type="password" {...register("password")} placeholder="Password" />
                        </div>

                        <div>
                            <label className="block text-foreground font-semibold mb-2 text-sm">
                                Confirm Password
                            </label>
                            <Input
                                type="password"
                                required={false}
                                {...register("password_confirmation")}
                                placeholder="Confirm password"
                            />
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        type="submit"
                        className="w-full rounded-full py-3.5 flex items-center justify-center gap-2"
                    >
                        {isLoading ? "Saving..." : "Sign Up"}
                        {!isLoading && <ArrowRight className="size-4" />}
                    </Button>
                </form>

                <div className="mt-8 text-center text-foreground/60">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-primary font-semibold hover:underline"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

function GoogleIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <svg className={className} viewBox="0 0 48 48" aria-hidden>
            <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
        </svg>
    );
}
