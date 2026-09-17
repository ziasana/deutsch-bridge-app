"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import {Suspense, useState} from "react";
import {UserType} from "@/types/user";
import {ToastContainer, toast} from "react-toastify";
import {forgotPassword} from "@/services/userService";
import Loading from "@/componenets/Loading";

const initialFormState: UserType ={
  email: ""
}
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
            toast("Please check your email! A password reset link has been sent.");
            setForm(initialFormState);
          }
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message ?? "Something went wrong. Please try again.");
          console.error(err?.response ?? err);
        })
        .finally(() => setIsLoading(false));
  };

  return (
      <Suspense fallback={<Loading />}>
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-card rounded-[10px] shadow-card p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground text-center mb-12">
          Reset Password
        </h1>
        {isLoading && <Loading message="Please wait..." />}
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-foreground/70 mb-2 text-sm">
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
        </Suspense>
  );
}
