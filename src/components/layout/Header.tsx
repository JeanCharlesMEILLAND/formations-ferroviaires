"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export default function Header({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const otherLocale = locale === "fr" ? "en" : "fr";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-nav">
      <div className="max-w-content mx-auto px-container flex items-center justify-between h-16">
        {/* Logo + Title */}
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center">
            <span className="text-white font-heading font-bold text-lg">F</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-heading font-bold text-navy-900 text-lg">
              FIF
            </span>
            <span className="text-navy-400 mx-1.5">|</span>
            <span className="font-heading text-electric-600 text-sm font-semibold">
              {dict.meta.siteName}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={`/${locale}`}
            className="text-body-sm font-medium text-navy-700 hover:text-electric-600 transition-colors"
          >
            {dict.nav.home}
          </Link>
          <a
            href="https://www.futurentrain.fr/formations/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-sm font-medium text-navy-400 hover:text-electric-600 transition-colors"
          >
            Futur en Train
          </a>
          <a
            href="https://www.onisep.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-sm font-medium text-navy-400 hover:text-electric-600 transition-colors"
          >
            ONISEP
          </a>
          <Link
            href={`/${otherLocale}`}
            className="px-3 py-1.5 rounded-button border border-navy-200 text-caption font-semibold text-navy-600 hover:bg-navy-50 transition-colors"
          >
            {dict.nav.switchLang}
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-navy-700"
          aria-label="Menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-navy-100 px-container py-4 space-y-3">
          <Link
            href={`/${locale}`}
            className="block text-body-sm font-medium text-navy-700"
            onClick={() => setMobileOpen(false)}
          >
            {dict.nav.home}
          </Link>
          <a
            href="https://www.futurentrain.fr/formations/"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-body-sm text-navy-400"
          >
            Futur en Train
          </a>
          <a
            href="https://www.onisep.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-body-sm text-navy-400"
          >
            ONISEP
          </a>
          <Link
            href={`/${otherLocale}`}
            className="inline-block px-3 py-1.5 rounded-button border border-navy-200 text-caption font-semibold text-navy-600"
          >
            {dict.nav.switchLang}
          </Link>
        </div>
      )}
    </header>
  );
}
