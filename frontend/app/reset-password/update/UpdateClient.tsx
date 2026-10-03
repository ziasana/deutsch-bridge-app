"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import FieldMessage from "@/componenets/FieldMessage";
import Link from "next/link";
import {useState} from "react";
import { toast } from "@/lib/toast";
import {resetPassword} from "@/services/userService";
import Loading from "@/componenets/Loading";
import {useSearchParams} from "next/navigation";
import {ResetPasswordType} from "@/types/user";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {UpdatePasswordFormData, updatePasswordSchema} from "@/schema/updatePasswordSchema";

export default function UpdateClient() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const [resetToken] = useState(searchParams.get("token"));
    const {
        register,
        reset,
        handleSubmit,
        formState: { errors },
    } = useForm<UpdatePasswordFormData>({
        resolver: zodResolver(updatePasswordSchema),
        mode: "onSubmit", // validate on submit
    });

    const onSubmit = async (data: UpdatePasswordFormData) => {
        setIsLoading(true);
        const updatedPassword : ResetPasswordType ={
            password: data.password ,
            token: resetToken,
        };
        resetPassword(updatedPassword)
            .then((data) => {
                if (data?.status == 200) {
                    toast.success("Your password successfully reset!");
                    reset()
                }
            })
            .catch((err) => {
                toast.error(err?.response?.data?.message ?? "Couldn't reset your password. The link may have expired - please request a new one.");
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md bg-card rounded-[10px] shadow-card p-8">
                {/* Title */}
                <h1 className="text-3xl font-bold text-foreground text-center mb-12">
                    Rest Password
                </h1>
                {isLoading && <Loading message="Please wait..." />}
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-foreground/70 mb-2 text-sm">
                            Password <Input
                            type="password"
                            {...register("password")}
                            placeholder="Enter your password."
                            aria-invalid={!!errors.password}
                            aria-describedby="up-password-msg"
                        />
                        </label>
                        <FieldMessage id="up-password-msg" error={errors.password?.message} hint="6 to 20 characters." />
                    </div>
                    {/* Confirm Password */}

                    <div>
                        <label className="block text-foreground/70 mb-2 text-sm">
                            Confirm Password <Input
                            type="password"
                            {...register("password_confirmation")}
                            aria-invalid={!!errors.password_confirmation}
                            aria-describedby="up-confirm-msg"
                        />
                        </label>
                        <FieldMessage id="up-confirm-msg" error={errors.password_confirmation?.message} />
                    </div>

                    {/* Submit */}
                    <Button variant="primary" className="w-full rounded-lg  py-3">
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </form>

                {/* Divider */}
                <div className="mt-6 text-center text-foreground/60">
                    Click here to go to the login page?
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
