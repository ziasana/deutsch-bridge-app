"use client";

import Link from "next/link";
import { Facebook, GraduationCap, Instagram, Linkedin, Mail, Twitter, Youtube } from "lucide-react";
import { useI18n } from "./I18nProvider";

const SOCIALS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0d0d21] text-slate-300">
      <div className="container mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand + about */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            DeutschBridge
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed">{t.footer.about}</p>
          <div className="flex items-center gap-3 pt-2">
            {SOCIALS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-full bg-white/5 text-slate-300 hover:bg-primary hover:text-primary-foreground transition"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-white font-semibold mb-5">{t.footer.quickLinksTitle}</h3>
          <ul className="flex flex-col gap-3 text-sm">
            {t.footer.quickLinks.map((label) => (
              <li key={label}>
                <Link href="/" className="text-slate-400 hover:text-primary transition">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-white font-semibold mb-5">{t.footer.resourcesTitle}</h3>
          <ul className="flex flex-col gap-3 text-sm">
            {t.footer.resources.map((label) => (
              <li key={label}>
                <Link href="/" className="text-slate-400 hover:text-primary transition">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Get in touch */}
        <div>
          <h3 className="text-white font-semibold mb-5">{t.footer.getInTouchTitle}</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{t.footer.getInTouchSubtitle}</p>
          <a
            href={`mailto:${t.footer.contactEmail}`}
            className="flex items-center gap-2 text-sm text-slate-200 hover:text-primary transition"
          >
            <Mail className="size-4 shrink-0" />
            {t.footer.contactEmail}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>{t.footer.copyright(year)}</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition">
              {t.footer.termsLabel}
            </Link>
            <Link href="/" className="hover:text-primary transition">
              {t.footer.privacyLabel}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
