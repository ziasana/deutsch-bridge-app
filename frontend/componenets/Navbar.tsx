"use client";
import { useState } from "react";
import Link from "next/link";
import { useDarkMode } from "./DarkModeProvider";
import useAuthStore from "@/store/useAuthStore";
import {  Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import Image from "next/image";

export default function Navbar() {
  const {userProfile, isLoggedIn} = useAuthStore();
  const logout = useAuthStore((state) => state.logout);

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

          {isLoggedIn && userProfile != null ? (
              <>
                <Link href="/dashboard" className="nav-link">
                  Dashboard
                </Link>
                <Link href="/dashboard/chat" className="nav-link">
                  Chat AI
                </Link>
                <Link href="/dashboard/vocabulary" className="nav-link">
                  Vocabulary
                </Link>
                <Link href="/dashboard/nomenVerbSection" className="nav-link">
                  NomenVerb
                </Link>
              </>
          ) : (
              <>
                <Link href="/" className="nav-link">
                  Home
                </Link>
                <Link href="/contact" className="nav-link">
                  Contact
                </Link>
              </>
          )}

        </div>

        {/* Right Side Buttons */}
        <div className="hidden md:flex ">
          {/* Dark Mode Toggle */}
          <div className="hidden md:flex relative float-left ">
            <h1 className="px-5 font-mono text-gray-700 dark:text-gray-300">
              {userProfile?.displayName ?? userProfile?.displayName}
            </h1>
          </div>
        </div>

        <div className="hidden md:flex  items-center justify-between gap-2">
          {/* Dark Mode Toggle */}

          {!isLoggedIn && userProfile == null && (
              <>
                <Link href="/login" className="btn-primary">
                  Login
                </Link>
              <Link href="/signup" className="btn-outline">
                Signup
              </Link>
              </>
          )
          }

          <button
              onClick={toggle}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
        </div>
        {isLoggedIn && userProfile != null && (
            <Menu as="div" className="relative">
              <MenuButton className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2">
                <span className="absolute -inset-1.5"/>
                <span className="sr-only">Open user menu</span>
                <Image
                    alt=""
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                    className="size-8 rounded-full bg-gray-200 dark:bg-gray-700 outline -outline-offset-1 outline-gray-300 dark:outline-white/10"
                    width={50}
                    height={50}
                />
              </MenuButton>

              <MenuItems
                  transition
                  className="
    absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md
    bg-white dark:bg-gray-800
    py-1 shadow-lg
    ring-1 ring-black/5 dark:ring-white/10
    outline-none focus:outline-none focus-visible:outline-none
    transition
    data-closed:scale-95 data-closed:opacity-0
    data-enter:duration-100 data-enter:ease-out
    data-leave:duration-75 data-leave:ease-in
  "
              >
                <MenuItem>
                  <Link
                      href="/profile"
                      className="
          block px-4 py-2 text-sm
          text-gray-700 dark:text-gray-300
          data-focus:bg-gray-100 dark:data-focus:bg-gray-700
           dark:data-focus:text-white
          outline-none
        "
                  >
                    Profile
                  </Link>
                </MenuItem>

                <MenuItem>
                  <Link
                      href="/profile/update-password"
                      className="
          block px-4 py-2 text-sm
          text-gray-700 dark:text-gray-300
          data-focus:bg-gray-100 dark:data-focus:bg-gray-700
          data-focus:text-gray-900 dark:data-focus:text-white
          outline-none
        "
                  >
                    Update Password
                  </Link>
                </MenuItem>

                <MenuItem>
                  {isLoggedIn && userProfile != null ? (
                      <a
                          href="#"
                          onClick={logout}
                          className="
          block px-4 py-2 text-sm
          text-gray-700 dark:text-gray-300
          data-focus:bg-gray-100 dark:data-focus:bg-gray-700
          data-focus:text-gray-900 dark:data-focus:text-white
          outline-none
        "
                      >
                        Sign out
                      </a>
                  ) : (
                      <Link
                          href="/login"

                          className="
          block px-4 py-2 text-sm
          text-gray-700 dark:text-gray-300
          data-focus:bg-gray-100 dark:data-focus:bg-gray-700
          data-focus:text-gray-900 dark:data-focus:text-white
          outline-none
        "
                      >
                        Login
                      </Link>
                  )
                  }

                </MenuItem>
              </MenuItems>

            </Menu>
        )}


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

            {isLoggedIn && userProfile != null ? (
                <Link href="#" onClick={logout}  className="btn-outline w-full text-center">
                  Logout
                </Link>
                ):
              <>
                <Link href="/login" className="btn-outline w-full text-center">
                  Login
                </Link>
                <Link href="/signup" className="btn-primary w-full text-center">
                  Signup
                </Link>
              </>
            }
          </div>
        </div>
      )}
    </nav>
  );
}
