"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Link from "next/link";
import {useEffect, useState} from "react";
import {UserType} from "@/types/user";
import {ToastContainer, toast} from "react-toastify";
import Loading from "@/componenets/Loading";
import {useRouter, useSearchParams} from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import {loginUser} from "@/services/userService";

interface FormDataType {
  password: string;
  username: string;
}
// define a clear initial state
const initialFormState: FormDataType = {
  username: "",
  password: ""
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<UserType>(initialFormState);
  const { login } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if(searchParams.get("success"))
      toast.success("Registration completed successfully. Now you can log in.");
  },[router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    loginUser(form)
        .then((data) => {
          if (data?.status == 200) {
            login(data?.data.user)
            router.push("/dashboard"); // redirect to dashboard page
          }
        })
        .catch((err) => {
         toast(err?.data.message);
          console.log(err);
        })
        .finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Login
        </h1>
        {isLoading && <Loading />}
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <Button variant="primary" type="submit"  className="w-full rounded-lg  py-3">
           submit
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
