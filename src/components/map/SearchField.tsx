"use client";

import { useId, useState } from "react";
import { useTypewriter } from "./hooks";

/**
 * Champ de recherche à étiquette vivante : au repos, l'étiquette « Je cherche » est suivie
 * d'une suggestion tapée lettre à lettre ; dès le focus ou la saisie, elle se replie en haut du champ.
 */
export default function SearchField({
  value,
  onChange,
  label,
  suggestions,
  compact = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  suggestions: string[];
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const idle = !focused && value === "";
  const typed = useTypewriter(suggestions, idle);

  return (
    <div className={`search-field ${idle ? "" : "is-active"} ${compact ? "is-compact" : ""}`}>
      <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        id={id}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === "Escape") onChange(""); }}
        aria-label={label}
      />
      <label htmlFor={id} className="search-label">
        <span className="search-label-static">{label}</span>
        <span className="search-label-ghost" aria-hidden="true">
          {typed}
          <span className="search-caret" />
        </span>
      </label>
      {value && (
        <button type="button" onClick={() => onChange("")} className="search-clear" aria-label="Effacer la recherche">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}
    </div>
  );
}
