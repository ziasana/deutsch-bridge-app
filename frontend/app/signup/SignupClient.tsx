"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import FieldMessage from "@/componenets/FieldMessage";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {useEffect, useState} from "react";
import {registerUser} from "@/services/userService";
import { toast } from "@/lib/toast";
import Loading from "@/componenets/Loading";
import GoogleSignInButton from "@/componenets/GoogleSignInButton";
import {useRouter, useSearchParams} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {signupSchema, SignupSchemaFormData} from "@/schema/signupSchema"
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
        formState: { errors },
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
                    Create your account
                </h1>
                <p className="text-lg text-foreground/70 mb-8">
                    Join thousands of learners mastering German with DeutschBridge. It only takes a minute to get started.
                </p>

                {isLoading && <Loading message="Please wait..." />}

                <GoogleSignInButton onLoadingChange={setIsLoading} />

                <div className="flex items-center gap-4 my-6">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-sm text-foreground/50">or</span>
                    <span className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-foreground font-semibold mb-2 text-sm">
                                Full Name
                            </label>
                            <Input type="text" {...register("displayName")} placeholder="Full name"
 aria-invalid={!!errors.displayName} aria-describedby="su-name-msg" />
<FieldMessage id="su-name-msg" error={errors.displayName?.message} hint="3 to 30 characters." />
                        </div>

                        <div>
                            <label className="block text-foreground font-semibold mb-2 text-sm">
                                Username
                            </label>
                            <Input type="text" {...register("username")} placeholder="Username"
 aria-invalid={!!errors.username} aria-describedby="su-username-msg" />
<FieldMessage id="su-username-msg" error={errors.username?.message} hint="At least 3 characters." />
                        </div>
                    </div>

                    <div>
                        <label className="block text-foreground font-semibold mb-2 text-sm">
                            Email
                        </label>
                        <Input type="email" {...register("email")} placeholder="Email"
 aria-invalid={!!errors.email} aria-describedby="su-email-msg" />
<FieldMessage id="su-email-msg" error={errors.email?.message} hint="We'll send a confirmation link to this address." />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-foreground font-semibold mb-2 text-sm">
                                Password
                            </label>
                            <Input type="password" {...register("password")} placeholder="Password"
 aria-invalid={!!errors.password} aria-describedby="su-password-msg" />
<FieldMessage id="su-password-msg" error={errors.password?.message} hint="At least 6 characters." />
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
                                aria-invalid={!!errors.password_confirmation}
                                aria-describedby="su-confirm-msg"
                            />
                            <FieldMessage id="su-confirm-msg" error={errors.password_confirmation?.message} />
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
