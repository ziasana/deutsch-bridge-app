"use client";

import Link from "next/link";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import type { SiteLink } from "./siteLinks";

export default function NavDropdown({ label, links }: Readonly<{ label: string; links: SiteLink[] }>) {
    return (
        <Menu as="div" className="relative">
            <MenuButton className="nav-link flex items-center gap-1 data-open:text-primary">
                {label}
                <ChevronDown className="size-4" />
            </MenuButton>
            <MenuItems
                transition
                anchor="bottom start"
                className="z-50 mt-3 w-80 origin-top rounded-2xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-border outline-none transition data-closed:scale-95 data-closed:opacity-0 data-enter:duration-100 data-leave:duration-75"
            >
                {links.map((link) => (
                    <MenuItem key={link.href}>
                        <Link href={link.href} className="block rounded-xl px-4 py-3 outline-none data-focus:bg-accent">
                            <span className="block text-sm font-semibold text-foreground">{link.title}</span>
                            {link.description && <span className="mt-0.5 block text-xs text-foreground/60">{link.description}</span>}
                        </Link>
                    </MenuItem>
                ))}
            </MenuItems>
        </Menu>
    );
}
