"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/componenets/layout/AppShell";
import Navbar from "@/componenets/Navbar";

const SHELL_PREFIXES = ["/dashboard", "/admin", "/profile", "/user-progress"];

export default function AppChrome({ children }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    const useShell = SHELL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    if (useShell) {
        return <AppShell>{children}</AppShell>;
    }

    return (
        <>
            <Navbar />
            <main>{children}</main>
        </>
    );
}
