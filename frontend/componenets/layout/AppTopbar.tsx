"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { GraduationCap, Menu as MenuIcon, Moon, Search, Sun } from "lucide-react";
import { useDarkMode } from "@/componenets/DarkModeProvider";
import { useI18n } from "@/componenets/I18nProvider";
import useAuthStore from "@/store/useAuthStore";
import type { NavItem } from "@/componenets/layout/navConfig";

interface AppTopbarProps {
    items: NavItem[];
    collapsed: boolean;
    onToggleCollapsed: () => void;
    onOpenMobileSidebar: () => void;
}

export default function AppTopbar({ items, collapsed, onToggleCollapsed, onOpenMobileSidebar }: Readonly<AppTopbarProps>) {
    const pathname = usePathname();
    const { darkMode, toggle } = useDarkMode();
    const { t } = useI18n();
    const { userProfile, logout } = useAuthStore();

    const activeItem = items.find((item) =>
        item.href === "/dashboard" || item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

    const initials = (userProfile?.displayName ?? userProfile?.email ?? "?")
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <header className="flex h-16 shrink-0 items-center gap-3 bg-topbar text-topbar-foreground px-4 md:px-6 shadow-sm z-30">
            <Link href={userProfile?.role === "ADMIN" ? "/admin" : "/dashboard"} className="flex items-center gap-2 shrink-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-topbar-foreground/15">
                    <GraduationCap className="size-5" />
                </div>
                <span className="hidden sm:inline truncate text-lg font-semibold">DeutschBridge</span>
            </Link>

            <button
                type="button"
                onClick={onOpenMobileSidebar}
                className="md:hidden flex size-9 items-center justify-center rounded-lg hover:bg-topbar-accent transition"
            >
                <MenuIcon className="size-5" />
                <span className="sr-only">Open menu</span>
            </button>

            <button
                type="button"
                onClick={onToggleCollapsed}
                title={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
                className="hidden md:flex size-9 items-center justify-center rounded-lg hover:bg-topbar-accent transition"
            >
                <MenuIcon className="size-5" />
                <span className="sr-only">{collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}</span>
            </button>

            <h1 className="hidden sm:block text-xl font-bold truncate">
                {activeItem?.label ?? "DeutschBridge"}
            </h1>

            <div className="flex-1" />

            <div className="hidden lg:flex items-center gap-2 rounded-xl bg-topbar-foreground/15 px-3 py-2 w-64">
                <Search className="size-4 text-topbar-foreground/70 shrink-0" />
                <input
                    type="text"
                    placeholder="Search here..."
                    className="w-full bg-transparent text-sm text-topbar-foreground placeholder:text-topbar-foreground/60 outline-none"
                />
            </div>

            <button
                type="button"
                onClick={toggle}
                className="flex size-9 items-center justify-center rounded-lg hover:bg-topbar-accent transition"
                title={darkMode ? t.nav.lightMode : t.nav.darkMode}
            >
                {darkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>

            <Menu as="div" className="relative">
                <MenuButton className="flex size-9 items-center justify-center rounded-full bg-topbar-foreground/15 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
                    <span className="sr-only">Open user menu</span>
                    {initials}
                </MenuButton>

                <MenuItems
                    transition
                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-popover text-popover-foreground py-1 shadow-lg ring-1 ring-border outline-none focus:outline-none transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                    <MenuItem>
                        <Link href="/profile" className="block px-4 py-2 text-sm text-foreground/80 data-focus:bg-accent data-focus:text-accent-foreground outline-none">
                            {t.nav.profile}
                        </Link>
                    </MenuItem>
                    <MenuItem>
                        <Link href="/user-progress" className="block px-4 py-2 text-sm text-foreground/80 data-focus:bg-accent data-focus:text-accent-foreground outline-none">
                            {t.nav.yourProgress}
                        </Link>
                    </MenuItem>
                    <MenuItem>
                        <Link href="/profile/update-password" className="block px-4 py-2 text-sm text-foreground/80 data-focus:bg-accent data-focus:text-accent-foreground outline-none">
                            {t.nav.updatePassword}
                        </Link>
                    </MenuItem>
                    <MenuItem>
                        <a href="#" onClick={logout} className="block px-4 py-2 text-sm text-foreground/80 data-focus:bg-accent data-focus:text-accent-foreground outline-none">
                            {t.nav.signOut}
                        </a>
                    </MenuItem>
                </MenuItems>
            </Menu>
        </header>
    );
}
