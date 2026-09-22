"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/componenets/layout/navConfig";
import { useI18n } from "@/componenets/I18nProvider";

interface AppSidebarProps {
    items: NavItem[];
    collapsed: boolean;
    onToggleCollapsed: () => void;
    onNavigate?: () => void;
    className?: string;
    showHeader?: boolean;
}

export default function AppSidebar({ items, collapsed, onToggleCollapsed, onNavigate, className, showHeader = false }: Readonly<AppSidebarProps>) {
    const pathname = usePathname();
    const { t } = useI18n();

    const isActive = (href: string) =>
        href === "/dashboard" || href === "/admin"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <aside
            className={cn(
                "flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200",
                collapsed ? "w-[76px]" : "w-[260px]",
                className,
            )}
        >
            {showHeader && (
                <div className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-sidebar-border">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <GraduationCap className="size-5" />
                    </div>
                    <span className="truncate text-lg font-semibold text-foreground">DeutschBridge</span>
                </div>
            )}

            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="flex flex-col gap-1">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    onClick={onNavigate}
                                    title={collapsed ? item.label : undefined}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                        active
                                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                        collapsed && "justify-center px-0",
                                    )}
                                >
                                    <Icon className="size-5 shrink-0" />
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="border-t border-sidebar-border p-3">
                <button
                    type="button"
                    onClick={onToggleCollapsed}
                    title={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
                    className={cn(
                        "hidden md:flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                        collapsed && "justify-center px-0",
                    )}
                >
                    {collapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
                    {!collapsed && <span>{t.nav.collapseSidebar}</span>}
                </button>
            </div>
        </aside>
    );
}
