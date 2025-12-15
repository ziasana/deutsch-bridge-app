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

interface FormDataType {
    password: string;
    confirmPassword: string;
}
// define a clear initial state
const initialFormState: FormDataType = {
    password: "",
    confirmPassword: "",
};

export default function IndexPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState<FormDataType>(initialFormState);
    const searchParams = useSearchParams();
    const [resetToken, setResetToken] = useState(searchParams.get("token"));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const updatedPassword : ResetPasswordType ={
            password: form.password ,
            token: resetToken,
        };
        resetPassword(updatedPassword)
            .then((data) => {
                if (data?.status == 200) {
                    toast("Your password successfully reset!");
                    setForm(initialFormState);
                }
            })
            .catch((err) => {
                toast(err?.message)
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
                    Rest Password
                </h1>
                {isLoading && <Loading message="Please wait..." />}
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Password <Input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password."
                        />
                        </label>
                    </div>
                    {/* Confirm Password */}

                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
                            Confirm Password <Input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange} />
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
