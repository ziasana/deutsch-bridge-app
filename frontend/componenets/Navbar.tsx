"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import { useI18n } from "./I18nProvider";
import {  Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { GraduationCap, Menu as MenuIcon, X } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const {userProfile, isLoggedIn} = useAuthStore();
  const logout = useAuthStore((state) => state.logout);

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? "bg-card border-b border-border shadow-sm"
          : "bg-accent/60 border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-xl font-bold text-foreground"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110">
            <GraduationCap className="size-5" />
          </span>
          DeutschBridge
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="nav-link">
            {t.nav.home}
          </Link>
          <Link href="/#features" className="nav-link">
            {t.nav.features}
          </Link>
          <Link href="/#about" className="nav-link">
            {t.nav.about}
          </Link>
          <Link href="/#blog" className="nav-link">
            {t.nav.blog}
          </Link>
          <Link href="/contact" className="nav-link">
            {t.nav.contact}
          </Link>

          {isLoggedIn && userProfile != null && (
              userProfile.role === "ADMIN" ? (
                  <Link href="/admin" className="nav-link">
                    {t.nav.adminDashboard}
                  </Link>
              ) : (
                  <Link href="/dashboard" className="nav-link">
                    {t.nav.dashboard}
                  </Link>
              )
          )}
        </div>

        {/* Right Side Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {userProfile?.displayName && (
            <h1 className="px-2 font-medium text-foreground/70">
              {userProfile.displayName}
            </h1>
          )}

          {!isLoggedIn && userProfile == null && (
              <>
                <Link
                    href="/login"
                    className="font-semibold text-foreground/70 hover:text-primary transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link href="/signup" className="btn-primary rounded-full px-5">
                  {t.nav.signup}
                </Link>
              </>
          )
          }

          {isLoggedIn && userProfile != null && (
              <Menu as="div" className="relative">
                <MenuButton className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2">
                  <span className="absolute -inset-1.5"/>
                  <span className="sr-only">Open user menu</span>
                  <Image
                      alt=""
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      className="size-8 rounded-full bg-muted outline -outline-offset-1 outline-border"
                      width={50}
                      height={50}
                  />
                </MenuButton>

                <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-popover text-popover-foreground py-1 shadow-lg ring-1 ring-border outline-none focus:outline-none transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <MenuItem>
                    <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-foreground/80 data-focus:bg-accent data-focus:text-accent-foreground outline-none"
                    >
                      {t.nav.profile}
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                        href="/user-progress"
                        className="block px-4 py-2 text-sm text-foreground/80 data-focus:bg-accent data-focus:text-accent-foreground outline-none"
                    >
                      {t.nav.yourProgress}
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                        href="/profile/update-password"
                        className="block px-4 py-2 text-sm text-foreground/80 data-focus:bg-accent data-focus:text-accent-foreground outline-none"
                    >
                      {t.nav.updatePassword}
                    </Link>
                  </MenuItem>

                  <MenuItem>
                    <a
                        href="#"
                        onClick={logout}
                        className="block px-4 py-2 text-sm text-foreground/80 data-focus:bg-accent data-focus:text-accent-foreground outline-none"
                    >
                      {t.nav.signOut}
                    </a>
                  </MenuItem>
                </MenuItems>

              </Menu>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="size-6" /> : <MenuIcon className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <Link href="/" className="mobile-link">
            {t.nav.home}
          </Link>
          <Link href="/#features" className="mobile-link">
            {t.nav.features}
          </Link>
          <Link href="/#about" className="mobile-link">
            {t.nav.about}
          </Link>
          <Link href="/#blog" className="mobile-link">
            {t.nav.blog}
          </Link>
          <Link href="/contact" className="mobile-link">
            {t.nav.contact}
          </Link>

          {isLoggedIn && userProfile != null && (
              userProfile.role === "ADMIN" ? (
                  <Link href="/admin" className="mobile-link">
                    {t.nav.adminDashboard}
                  </Link>
              ) : (
                  <>
                    <Link href="/dashboard" className="mobile-link">
                      {t.nav.dashboard}
                    </Link>
                    <Link href="/profile" className="mobile-link">
                      {t.nav.profile}
                    </Link>
                    <Link href="/user-progress" className="mobile-link">
                      {t.nav.yourProgress}
                    </Link>
                  </>
              )
          )}

          <div className="border-t border-border mt-2 pt-2 flex flex-col gap-2 px-6 pb-4">
            {isLoggedIn && userProfile != null ? (
                <Link href="#" onClick={logout}  className="btn-outline w-full text-center">
                  {t.nav.logout}
                </Link>
                ):
              <>
                <Link href="/login" className="btn-outline w-full text-center">
                  {t.nav.login}
                </Link>
                <Link href="/signup" className="btn-primary w-full text-center">
                  {t.nav.signup}
                </Link>
              </>
            }
          </div>
        </div>
      )}
    </nav>
  );
}
