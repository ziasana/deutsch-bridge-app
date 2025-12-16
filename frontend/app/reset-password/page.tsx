"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Link from "next/link";
import { useState } from "react";
import {UserType} from "@/types/user";
import {ToastContainer, toast} from "react-toastify";
import {forgotPassword, resetPassword} from "@/services/userService";
import Loading from "@/componenets/Loading";

const initialFormState: UserType ={
  email: ""
}
export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<UserType>(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    forgotPassword(form)
        .then((data) => {
          if (data?.status == 200) {
            toast("Please check your email! The reset password has been reset successfully send!");
            setForm(initialFormState);
          }
        })
        .catch((err) => {
          toast.error(err?.response.data.message)
          console.error(err?.response);
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
              Email <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email."
            />
            </label>
          </div>

          {/* Submit */}
          <Button variant="primary" className="w-full rounded-lg  py-3">
            {isLoading ? "sending..." : "Send Reset Link"}
          </Button>
        </form>

        <ToastContainer />
        {/* Divider */}

      </div>
    </div>
  );
}
