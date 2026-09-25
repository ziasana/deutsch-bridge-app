"use client";

import { Facebook, Instagram, Linkedin, Mail, MapPin, Moon, Sun, Twitter, Youtube } from "lucide-react";
import { useDarkMode } from "./DarkModeProvider";
import { useI18n } from "./I18nProvider";

const SOCIALS = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
];

export default function TopBar() {
    const { t } = useI18n();
    const { darkMode, toggle } = useDarkMode();

    return (
        <div className="bg-[#0d0d21] text-slate-300">
            <div className="container mx-auto px-6 py-2.5 flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-5">
                    <span className="flex items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-primary" />
                        <span className="hidden sm:inline">{t.topbar.address}</span>
                    </span>
                    <a
                        href={`mailto:${t.footer.contactEmail}`}
                        className="flex items-center gap-2 hover:text-primary transition"
                    >
                        <Mail className="size-4 shrink-0 text-primary" />
                        {t.footer.contactEmail}
                    </a>
                </div>

                <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-slate-400">{t.topbar.followUs}</span>
                    <div className="flex items-center gap-2">
                        {SOCIALS.map(({ icon: Icon, href, label }) => (
                            <a
                                key={label}
                                href={href}
                                aria-label={label}
                                className="flex size-7 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-primary hover:text-primary-foreground transition"
                            >
                                <Icon className="size-3.5" />
                            </a>
                        ))}
                    </div>

                    <span className="h-5 w-px bg-white/10" aria-hidden />

                    <button
                        type="button"
                        onClick={toggle}
                        aria-label={darkMode ? t.nav.lightMode : t.nav.darkMode}
                        className="flex size-7 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-primary hover:text-primary-foreground transition"
                    >
                        {darkMode ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
