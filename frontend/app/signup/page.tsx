"use client";

import Button from "@/componenets/Button";
import Link from "next/link";
import {useState} from "react";
import {registerUser} from "@/services/userService";
import {UserType} from "@/types/user";
import {toast, ToastContainer} from "react-toastify";
interface FormDataType {
  name: string;
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
}
// define a clear initial state
const initialFormState: FormDataType = {
  name: "",
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<FormDataType>(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const newUser: UserType = {
      username: form.username,
      password: form.password,
      email: form.email
    }
    registerUser(newUser)
        .then((data) => {
          if (data?.status == 201) {
            toast("You have successfully registered! check your email for verification!");
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Create an Account
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Full Name <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Email <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Username */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Username <input
                type="text"
                name="username"
                required
                value={form.username}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Password <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            </label>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2 text-sm">
              Confirm Password <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
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
