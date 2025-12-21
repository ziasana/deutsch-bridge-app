"use client";

import Button from "@/componenets/Button";
import Link from "next/link";
import {useEffect, useState} from "react";
import {registerUser} from "@/services/userService";
import {toast, ToastContainer} from "react-toastify";
import Loading from "@/componenets/Loading";
import {useRouter, useSearchParams} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {signupSchema, SignupSchemaFormData} from "@/schema/signupSchema"
import {useFormErrorToast} from "@/hook/useFormErrorToast";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_confirmation, ...newUser } = data; // remove confirmPassword
    registerUser(newUser)
        .then((data) => {
          if (data?.status == 201) {
            toast.success("You have successfully registered! check your email for verification!");
            reset();
          }
        })
        .catch((err) => {
          toast.error(err?.response.data.message)
          console.error(err)
        })
        .finally(() => setIsLoading(false));
  };
  useFormErrorToast(errors, isSubmitted);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Create an Account
        </h1>
        {isLoading && <Loading message="Please wait..." />}
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Full Name <input
              type="text"
              required
              {...register("displayName")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Email <input
              type="email"
              required
              {...register("email")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Username */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Username <input
                type="text"
                required
                {...register("username")}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Password <input
              type="password"
              required
              {...register("password")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Confirm Password <input
              type="password"
              {...register("password_confirmation")}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Submit */}
          <Button

              variant="primary" className="w-full rounded-lg  py-3">

            {isLoading ? "Saving..." : "Sign Up"}

          </Button>
          <ToastContainer />
        </form>

        {/* Divider */}
        <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Already have an account?
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
