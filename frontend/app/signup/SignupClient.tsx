"use client";

import Button from "@/componenets/Button";
import Link from "next/link";
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
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md bg-card rounded-[10px] shadow-card p-8">
                {/* Title */}
                <h1 className="text-3xl font-bold text-foreground text-center mb-8">
                    Create an Account
                </h1>
                {isLoading && <Loading message="Please wait..." />}
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-foreground/70 mb-2 text-sm">
                            Full Name <input
                            type="text"
                            required
                            {...register("displayName")}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                        </label>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-foreground/70 mb-2 text-sm">
                            Email <input
                            type="email"
                            required
                            {...register("email")}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                        </label>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-foreground/70 mb-2 text-sm">
                            Username <input
                            type="text"
                            required
                            {...register("username")}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                        </label>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-foreground/70 mb-2 text-sm">
                            Password <input
                            type="password"
                            required
                            {...register("password")}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                        </label>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-foreground/70 mb-2 text-sm">
                            Confirm Password <input
                            type="password"
                            {...register("password_confirmation")}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                        />
                        </label>
                    </div>

                    {/* Submit */}
                    <Button

                        variant="primary" className="w-full rounded-lg  py-3">

                        {isLoading ? "Saving..." : "Sign Up"}

                    </Button>
                </form>

                {/* Divider */}
                <div className="mt-6 text-center text-foreground/60">
                    Already have an account?
                    <Link
                        href="/login"
                        className="text-primary hover:underline ml-1"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
