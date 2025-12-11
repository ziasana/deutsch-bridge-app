"use client";

import Button from "@/componenets/Button";
import Input from "@/componenets/Input";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    console.log("Form data", form);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Login
        </h1>

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
          <Button variant="primary" className="w-full rounded-lg  py-3">
            Login
          </Button>
        </form>

        {/* Divider */}
        <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
          Don&#39;t have an account?
          <Link
            href="/signup"
            className="text-blue-600 dark:text-blue-400 hover:underline ml-1"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
