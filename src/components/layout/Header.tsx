"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { useSelection } from "@/lib/selection";

export const CONTACT_MAILTO =
  "mailto:contact@objectif-ofp.org?subject=Formations%20ferroviaires%20%3A%20mise%20%C3%A0%20jour%20d%27une%20fiche";

export default function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [open, setOpen] = useState(false);
  const sel = useSelection();
  const other = locale === "fr" ? "en" : "fr";
  const links: Array<{ href: string; label: string; external?: boolean }> = [
    { href: `/${locale}#metiers`, label: dict.nav.metiers },
    { href: `/${locale}#parcours`, label: dict.nav.parcours },
    { href: `/${locale}/carte`, label: dict.nav.map },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-[1100] bg-navy-900 text-white">
      <div className="max-w-content mx-auto px-container flex items-center justify-between gap-4 h-16">
        <Link href={`/${locale}`} className="flex items-center gap-3" aria-label={dict.meta.siteName}>
          <span className="w-9 h-9 rounded-[9px] bg-signal-300 text-navy-900 font-heading font-extrabold text-sm grid place-items-center">FF</span>
          <span className="leading-tight">
            <span className="block font-heading font-bold text-[17px]">{dict.meta.siteName}</span>
            <span className="hidden sm:block text-[11px] uppercase tracking-wider text-navy-300 font-medium">{dict.meta.tagline}</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-body-sm font-semibold" aria-label="Principal">
          {links.map((l) =>
            l.external ? (
              <a key={l.label} href={l.href} className="text-navy-300 hover:text-white transition-colors">{l.label}</a>
            ) : (
              <Link key={l.label} href={l.href} className="text-navy-300 hover:text-white transition-colors">{l.label}</Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          {sel.count > 0 && (
            <Link href={`/${locale}/selection`} className="inline-flex items-center gap-1.5 rounded-button bg-electric-500 hover:bg-electric-600 text-white px-3 py-2 text-caption font-bold transition-colors" title={dict.nav.selection}>
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>
              <span className="hidden sm:inline">{dict.nav.selection}</span> {sel.count}
            </Link>
          )}
          <Link
            href={`/${locale}/carte?near=1`}
            className="hidden sm:inline-flex items-center gap-2 rounded-button border border-white/25 px-4 py-2 text-body-sm font-bold hover:border-signal-300 hover:text-signal-300 transition-colors"
          >
            <span aria-hidden="true">◎</span> {dict.nav.near}
          </Link>
          <Link
            href={`/${other}`}
            className="hidden sm:inline-flex rounded-button border border-white/15 px-3 py-2 text-caption font-bold text-navy-300 hover:text-white"
            aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
          >
            {dict.nav.switchLang}
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10"
            aria-label="Menu"
            aria-expanded={open}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 px-container py-4 space-y-3 bg-navy-900">
          {links.map((l) =>
            l.external ? (
              <a key={l.label} href={l.href} className="block text-body font-semibold text-navy-200" onClick={() => setOpen(false)}>{l.label}</a>
            ) : (
              <Link key={l.label} href={l.href} className="block text-body font-semibold text-navy-200" onClick={() => setOpen(false)}>{l.label}</Link>
            )
          )}
          <div className="flex gap-2 pt-2">
            <Link href={`/${locale}/carte?near=1`} className="inline-flex items-center gap-2 rounded-button border border-white/25 px-4 py-2 text-body-sm font-bold" onClick={() => setOpen(false)}>
              <span aria-hidden="true">◎</span> {dict.nav.near}
            </Link>
            <Link href={`/${other}`} className="inline-flex rounded-button border border-white/15 px-3 py-2 text-caption font-bold text-navy-300">{dict.nav.switchLang}</Link>
          </div>
        </div>
      )}
    </header>
  );
}
