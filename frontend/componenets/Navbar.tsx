"use client";
import { useState } from "react";
import Link from "next/link";
import { useDarkMode } from "./DarkModeProvider";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode, toggle } = useDarkMode();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-indigo-600 dark:text-indigo-400"
        >
          DeutschBridge
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/features" className="nav-link">
            Features
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
          <Link href="/contact" className="nav-link">
            Contact
          </Link>
          <Link href="/dashboard" className="nav-link">
            Dashboard
          </Link>
        </div>

        {/* Right Side Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {darkMode ? "🌙" : "☀️"}
          </button>

          <Link href="/login" className="btn-outline">
            Login
          </Link>
          <Link href="/signup" className="btn-primary">
            Signup
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-800 dark:text-gray-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-md">
          <Link href="/" className="mobile-link">
            Home
          </Link>
          <Link href="/features" className="mobile-link">
            Features
          </Link>
          <Link href="/about" className="mobile-link">
            About
          </Link>
          <Link href="/contact" className="mobile-link">
            Contact
          </Link>

          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex flex-col gap-2 px-6 pb-4">
            {/* Dark Mode Button */}
            <button
              onClick={toggle}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {darkMode ? "Dark Mode 🌙" : "Light Mode ☀️"}
            </button>

            <Link href="/login" className="btn-outline w-full text-center">
              Login
            </Link>
            <Link href="/signup" className="btn-primary w-full text-center">
              Signup
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
