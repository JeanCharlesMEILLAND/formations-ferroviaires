"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useTypewriter } from "@/components/map/hooks";

/** Barre de recherche du hero : même étiquette vivante que sur la carte, envoi vers /carte?q=. */
export default function HeroSearch({
  action, label, suggestions, nearHref, nearLabel, submitLabel,
}: { action: string; label: string; suggestions: string[]; nearHref: string; nearLabel: string; submitLabel: string }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const idle = !focused && value === "";
  const typed = useTypewriter(suggestions, idle);

  return (
    <form action={action} method="get" role="search" className="flex flex-wrap gap-2 items-center bg-white rounded-2xl p-2 shadow-search">
      <div className={`search-field is-hero flex-1 min-w-[14rem] ${idle ? "" : "is-active"}`}>
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input
          id={id}
          name="q"
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
        />
        <label htmlFor={id} className="search-label">
          <span className="search-label-static">{label}</span>
          <span className="search-label-ghost" aria-hidden="true">{typed}<span className="search-caret" /></span>
        </label>
      </div>
      <Link href={nearHref} className="rounded-xl bg-navy-100 text-navy-900 px-3 py-2.5 text-body-sm font-bold whitespace-nowrap hover:bg-navy-200 transition-colors">
        ◎ {nearLabel}
      </Link>
      <button type="submit" className="rounded-xl bg-electric-500 hover:bg-electric-600 text-white px-5 py-3 text-body-sm font-extrabold transition-colors">
        {submitLabel}
      </button>
    </form>
  );
}
