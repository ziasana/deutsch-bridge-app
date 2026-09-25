"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronsLeft, ChevronsRight, GraduationCap } from "lucide-react";
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
    const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({});

    // Pick the single most specific (longest) href that matches the current path, so a
    // parent route (e.g. "/dashboard/reading") never lights up alongside a nested one
    // that also matches (e.g. "/dashboard/reading/review").
    const allHrefs = items.flatMap((item) => (item.children ? item.children.map((c) => c.href) : [item.href])).filter(
        (href): href is string => Boolean(href),
    );
    const bestMatch = allHrefs.reduce<string | null>((best, href) => {
        const matches = pathname === href || pathname.startsWith(`${href}/`);
        if (!matches) return best;
        return !best || href.length > best.length ? href : best;
    }, null);
    const isActive = (href: string) => href === bestMatch;

    const toggleExpand = (label: string, current: boolean) =>
        setExpandedOverride((prev) => ({ ...prev, [label]: !current }));

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

                        if (item.children) {
                            const hasActiveChild = item.children.some((c) => c.href && isActive(c.href));
                            const expanded = expandedOverride[item.label] ?? hasActiveChild;

                            if (collapsed) {
                                const firstHref = item.children[0]?.href ?? "#";
                                return (
                                    <li key={item.label}>
                                        <Link
                                            href={firstHref}
                                            onClick={onNavigate}
                                            title={item.label}
                                            className={cn(
                                                "flex items-center justify-center px-0 gap-3 rounded-xl py-2.5 text-sm font-medium transition-colors",
                                                hasActiveChild
                                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                            )}
                                        >
                                            <Icon className="size-5 shrink-0" />
                                        </Link>
                                    </li>
                                );
                            }

                            return (
                                <li key={item.label}>
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(item.label, expanded)}
                                        aria-expanded={expanded}
                                        className={cn(
                                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                            hasActiveChild
                                                ? "text-sidebar-foreground"
                                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                        )}
                                    >
                                        <Icon className="size-5 shrink-0" />
                                        <span className="truncate flex-1 text-left">{item.label}</span>
                                        <ChevronDown className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} />
                                    </button>
                                    {expanded && (
                                        <ul className="mt-1 flex flex-col gap-1 ps-4">
                                            {item.children.map((child) => {
                                                const ChildIcon = child.icon;
                                                const childActive = child.href ? isActive(child.href) : false;
                                                return (
                                                    <li key={child.href}>
                                                        <Link
                                                            href={child.href ?? "#"}
                                                            onClick={onNavigate}
                                                            className={cn(
                                                                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                                                                childActive
                                                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                                                                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                                            )}
                                                        >
                                                            <ChildIcon className="size-4 shrink-0" />
                                                            <span className="truncate">{child.label}</span>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </li>
                            );
                        }

                        const active = item.href ? isActive(item.href) : false;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href ?? "#"}
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
