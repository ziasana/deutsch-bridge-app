"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Link from "next/link";
import {useEffect, useState, useActionState} from "react";
import {UserType} from "@/types/user";
import {ToastContainer, toast} from "react-toastify";
import Loading from "@/componenets/Loading";
import { loginAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";

const initialFormState: UserType ={
  username: "", password: ""
}
type LoginState = {
  success?: boolean;
  data?: never;
  error?: string;
};
export default function LoginPage() {
  const router = useRouter();
  const authState = useAuthStore((state) => state.login);
  const [state, formAction, isPending] = useActionState<LoginState>(loginAction, {});
  const [form, setForm] = useState<UserType>(initialFormState);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      authState(state?.data.user)
      console.log(state?.data.user);
      toast.success("Login successful!");
      router.push("/dashboard"); // redirect to dashboard page
    }
  }, [state, router, authState]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Login
        </h1>
        {isPending && <Loading message="Please wait..." />}
        {/* Form */}
        <form action={formAction} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Username <Input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username."
            />
            </label>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Password <Input
              name={"password"}
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password."
            />
            </label>
          </div>


          {/* Submit */}
          <Button variant="primary" type="submit" disabled={isPending} className="w-full rounded-lg  py-3">
            {isPending ? "Loading..." : "Login"}
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
          <Link
              href="/reset-password"
              className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Don&#39;t have an account?
          <Link
            href="/signup"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Sign up

          </Link>

          <ToastContainer />
        </div>
      </div>
    </div>
  );
}
