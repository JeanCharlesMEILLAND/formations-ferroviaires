"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTypewriter } from "./hooks";
import type { SuggestionItem, SuggestionKind } from "@/lib/search";

const KIND_ICON: Record<SuggestionKind, string> = {
  establishment: "M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z",
  formation: "M12 3L3 8l9 5 9-5-9-5zM3 13l9 5 9-5M3 18l9 5 9-5",
  metier: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  city: "M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
};

/**
 * Champ de recherche à étiquette vivante : au repos, l'étiquette « Je cherche » est suivie d'une suggestion tapée
 * lettre à lettre ; dès le focus ou la saisie, elle se replie en haut du champ. Avec `suggest`, une liste de
 * propositions (établissements, formations, métiers, villes) s'ouvre sous le champ, pilotable au clavier.
 */
export default function SearchField({
  value, onChange, label, suggestions, compact = false, autoFocus = false, suggest, onPick, onSubmit, kindLabels,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  suggestions: string[];
  compact?: boolean;
  autoFocus?: boolean;
  suggest?: (q: string) => SuggestionItem[];
  onPick?: (item: SuggestionItem) => void;
  onSubmit?: () => void;
  kindLabels?: Record<SuggestionKind, string>;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const idle = !focused && value === "";
  const typed = useTypewriter(suggestions, idle);
  const items = open && suggest && value.trim().length >= 2 ? suggest(value) : [];

  // Fermeture au clic hors du champ
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (item: SuggestionItem) => { setOpen(false); setActive(-1); onPick?.(item); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { if (open) { setOpen(false); } else onChange(""); return; }
    if (!items.length) { if (e.key === "Enter") { e.preventDefault(); onSubmit?.(); } return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (active >= 0) pick(items[active]); else onSubmit?.(); }
  };

  let lastKind: SuggestionKind | null = null;

  return (
    <div ref={rootRef} className={`search-field ${idle ? "" : "is-active"} ${compact ? "is-compact" : ""}`}>
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
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        aria-label={label}
        role={suggest ? "combobox" : undefined}
        aria-expanded={suggest ? items.length > 0 : undefined}
        aria-controls={suggest ? `${id}-list` : undefined}
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-autocomplete={suggest ? "list" : undefined}
      />
      <label htmlFor={id} className="search-label">
        <span className="search-label-static">{label}</span>
        <span className="search-label-ghost" aria-hidden="true">
          {typed}
          <span className="search-caret" />
        </span>
      </label>
      {value && (
        <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="search-clear" aria-label="Effacer la recherche">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}
      {items.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="sug">
          {items.map((item, i) => {
            const showKind = item.kind !== lastKind;
            lastKind = item.kind;
            return (
              <li
                key={`${item.kind}-${item.slug}`}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                className={`sug-item ${i === active ? "is-active" : ""} ${showKind ? "has-kind" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(item)}
              >
                <span className={`sug-icon is-${item.kind}`} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d={KIND_ICON[item.kind]} /></svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="sug-label">{item.label}</span>
                  {item.sub && <span className="sug-sub">{item.sub}</span>}
                </span>
                {showKind && kindLabels && <span className="sug-kind">{kindLabels[item.kind]}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
