"use client";

import { useState } from "react";
import AppSidebar from "@/componenets/layout/AppSidebar";
import AppTopbar from "@/componenets/layout/AppTopbar";
import { getAdminNavItems, getUserNavItems } from "@/componenets/layout/navConfig";
import { useI18n } from "@/componenets/I18nProvider";
import useAuthStore from "@/store/useAuthStore";

export default function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
    const { userProfile } = useAuthStore();
    const { t } = useI18n();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleCollapsed = () => setCollapsed((prev) => !prev);

    const items = userProfile?.role === "ADMIN" ? getAdminNavItems(t) : getUserNavItems(t);

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <AppTopbar
                items={items}
                collapsed={collapsed}
                onToggleCollapsed={toggleCollapsed}
                onOpenMobileSidebar={() => setMobileOpen(true)}
            />

            <div className="flex flex-1 min-h-0">
                <AppSidebar
                    items={items}
                    collapsed={collapsed}
                    onToggleCollapsed={toggleCollapsed}
                    className="hidden md:flex"
                />

                {mobileOpen && (
                    <div className="fixed inset-0 z-40 md:hidden">
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setMobileOpen(false)}
                        />
                        <div className="absolute inset-y-0 left-0 w-[260px] shadow-xl">
                            <AppSidebar
                                items={items}
                                collapsed={false}
                                onToggleCollapsed={() => setMobileOpen(false)}
                                onNavigate={() => setMobileOpen(false)}
                                showHeader
                            />
                        </div>
                    </div>
                )}

                <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
