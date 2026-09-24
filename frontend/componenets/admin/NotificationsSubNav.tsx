"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
    { href: "/admin/notifications/list", label: "List" },
    { href: "/admin/notifications/settings", label: "Settings" },
];

export default function NotificationsSubNav() {
    const pathname = usePathname();

    return (
        <nav className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-8">
            {TABS.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            isActive
                                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
