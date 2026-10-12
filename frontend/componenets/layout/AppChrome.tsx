"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/componenets/layout/AppShell";
import Navbar from "@/componenets/Navbar";
import Footer from "@/componenets/Footer";
import TopBar from "@/componenets/TopBar";

const SHELL_PREFIXES = ["/dashboard", "/admin", "/profile", "/user-progress", "/notifications"];

/** Pages that run without any site menu, so nothing distracts from the task (the running exam). */
const FOCUS_PREFIXES = ["/dashboard/exam-prep/pruefung/durchfuehrung"];

export default function AppChrome({ children }: Readonly<{ children: React.ReactNode }>) {
    const pathname = usePathname();
    if (FOCUS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
        return <main>{children}</main>;
    }

    const useShell = SHELL_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

    if (useShell) {
        return <AppShell>{children}</AppShell>;
    }

    return (
        <>
            <TopBar />
            <Navbar />
            <main>{children}</main>
            <Footer />
        </>
    );
}
