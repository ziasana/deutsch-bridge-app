"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import useAuthStore from "@/store/useAuthStore";

/**
 * A link to /signup or /login that sends already signed-in learners straight to the dashboard,
 * so they never see the signup or login form again until they log out.
 */
export default function AuthAwareLink({ href, ...props }: ComponentProps<typeof Link>) {
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn && s.hasHydrated);
    return <Link href={isLoggedIn ? "/dashboard" : href} {...props} />;
}
