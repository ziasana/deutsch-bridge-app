"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Link from "next/link";
import {useState} from "react";
import {ToastContainer, toast} from "react-toastify";
import {resetPassword} from "@/services/userService";
import Loading from "@/componenets/Loading";
import {useSearchParams} from "next/navigation";
import {ResetPasswordType} from "@/types/user";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {UpdatePasswordFormData, updatePasswordSchema} from "@/schema/updatePasswordSchema";
import {useFormErrorToast} from "@/hook/useFormErrorToast";

export default function IndexPage() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const [resetToken] = useState(searchParams.get("token"));
    const {
        register,
        reset,
        handleSubmit,
        formState: { errors, isSubmitted },
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
                    toast("Your password successfully reset!");
                    reset()
                }
            })
            .catch((err) => {
                toast.error(err?.response.data.message)
                console.error(err?.response)
            })
            .finally(() => setIsLoading(false));
    };
    useFormErrorToast(errors, isSubmitted);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
                    Rest Password
                </h1>
                {isLoading && <Loading message="Please wait..." />}
                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Password <Input
                            type="password"
                            {...register("password")}
                            placeholder="Enter your password."
                        />
                        </label>
                    </div>
                    {/* Confirm Password */}

                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Confirm Password <Input
                            type="password"
                            {...register("password_confirmation")}
                             />
                        </label>
                    </div>

                    {/* Submit */}
                    <Button variant="primary" className="w-full rounded-lg  py-3">
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </form>

                {/* Divider */}
                <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
                    Click here to go to the login page?
                    <Link
                        href="/login"
                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
                    >
                        Login
                    </Link>
                    <ToastContainer />
                </div>
            </div>
        </div>
    );
}
