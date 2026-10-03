"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import FieldMessage from "@/componenets/FieldMessage";
import {z} from "zod";
import {Suspense, useState} from "react";
import {UserType} from "@/types/user";
import { toast } from "@/lib/toast";
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
  const [emailError, setEmailError] = useState<string>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setEmailError(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email?.trim() ?? "";
    if (!email) return setEmailError("Please enter your email address");
    if (!z.email().safeParse(email).success) return setEmailError("Enter a valid email address, e.g. name@example.com");
    setIsLoading(true);

    forgotPassword(form)
        .then((data) => {
          if (data?.status == 200) {
            toast.success("Please check your email! A password reset link has been sent.");
            setForm(initialFormState);
          }
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message ?? "Couldn't send the reset link. Please try again.");
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
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-foreground/70 mb-2 text-sm">
              Email <Input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email."
              aria-invalid={!!emailError}
              aria-describedby="fp-email-msg"
            />
            </label>
            <FieldMessage id="fp-email-msg" error={emailError} hint="We'll email you a link to reset your password." />
          </div>

          {/* Submit */}
          <Button variant="primary" className="w-full rounded-lg  py-3">
            {isLoading ? "sending..." : "Send Reset Link"}
          </Button>
        </form>

        {/* Divider */}

      </div>
    </div>
        </Suspense>
  );
}
