"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Link from "next/link";
import {useEffect, useState} from "react";
import {ToastContainer, toast} from "react-toastify";
import Loading from "@/componenets/Loading";
import {useRouter, useSearchParams} from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import {loginUser} from "@/services/userService";
import {zodResolver} from "@hookform/resolvers/zod";
import {loginSchema, LoginFormData} from "@/schema/loginSchema"
import { useForm} from "react-hook-form";
import {useFormErrorToast} from "@/hook/useFormErrorToast";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if(searchParams.get("success"))
      toast.success("Registration completed successfully. Now you can log in.");
  },[router, searchParams]);


  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
   } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit", // validate on submit
  });

  const onSubmit = async (data: LoginFormData) => {
    loginUser(data)
        .then((data) => {
          if (data?.status == 200) {
            login(data?.data.data) // user data
            router.push("/dashboard"); // redirect to dashboard page
          }
        })
        .catch((err) => {
          console.log(err.message);
        })
        .finally(() => setIsLoading(false));
  };
  useFormErrorToast(errors, isSubmitted);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Login
        </h1>
        {isLoading && <Loading />}
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Email <Input
              type="text"
              {...register("email")}
              placeholder="Enter your email."
            />

            </label>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Password <Input
              type="password"
              {...register("password")}
              placeholder="Enter your password."
            />

            </label>
          </div>

          {/* Submit */}
          <Button variant="primary" type="submit"  className="w-full rounded-lg  py-3">
            {isLoading ? "Logging in..." : "Login"}
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
