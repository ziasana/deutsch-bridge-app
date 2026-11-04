"use client";

import Link from "next/link";
import { Logo } from "@/componenets/brand/Logo";
import { Facebook, Instagram, Linkedin, Mail, Twitter, Youtube } from "lucide-react";
import { useI18n } from "./I18nProvider";
import { getExamLinks, getLearnLinks } from "@/componenets/marketing/siteLinks";
import { LANDING_PAGES } from "@/lib/landingPages";
import { useMarketing } from "@/componenets/marketing/useMarketing";

const SOCIALS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
  const { t } = useI18n();
  const { m } = useMarketing();
  const companyLinks = [
    { href: "/", title: t.nav.home },
    { href: "/mock-test", title: m.nav.mockTest },
    { href: "/pricing", title: m.nav.pricing },
    { href: "/blog", title: t.nav.blog },
    { href: "/contact", title: t.nav.contact },
  ];
  const columns = [
    { title: m.nav.exams, links: getExamLinks(m) },
    { title: m.nav.learn, links: getLearnLinks(m) },
    { title: t.footer.quickLinksTitle, links: companyLinks },
  ];
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0d0d21] text-slate-300">
      <div className="container mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand + about */}
        <div className="flex flex-col gap-4">
          <Link href="/" aria-label="DeutschCertify home" className="flex items-center text-white">
            <Logo variant="bare" textClassName="text-xl font-bold" />
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

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-white font-semibold mb-5">{column.title}</h3>
            <ul className="flex flex-col gap-3 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-slate-400 hover:text-primary transition">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

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

      <nav aria-label="Deutsch lernen" className="border-t border-white/10">
        <ul lang="de" className="container mx-auto flex flex-wrap gap-x-6 gap-y-2 px-6 py-5 text-sm">
          {LANDING_PAGES.map((p) => (
            <li key={p.slug}>
              <Link href={`/${p.slug}`} className="text-slate-400 hover:text-primary transition">{p.keyword}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-col gap-1 text-center sm:text-start">
            <p>{t.footer.copyright(year)}</p>
            <p className="max-w-2xl text-slate-500">{m.common.disclaimer}</p>
          </div>
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
