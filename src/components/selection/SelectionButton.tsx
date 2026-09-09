"use client";

import { useState } from "react";
import { useSelection } from "@/lib/selection";

/** Signet « Ajouter à ma sélection » : pastille seule (icon) ou bouton avec libellé. */
export default function SelectionButton({
  slug, labels, variant = "button", className = "",
}: { slug: string; labels: { add: string; added: string; full: string }; variant?: "button" | "icon" | "chip"; className?: string }) {
  const sel = useSelection();
  const on = sel.has(slug);
  const [note, setNote] = useState<string | null>(null);
  const click = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const r = sel.toggle(slug);
    if (r === "full") { setNote(labels.full.replace("{max}", String(sel.max))); setTimeout(() => setNote(null), 2500); }
  };
  const icon = (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden="true" className="w-4 h-4"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>
  );
  if (variant === "icon") {
    return (
      <span className="relative inline-flex">
        <button type="button" onClick={click} className={`bookmark ${on ? "is-on" : ""} ${className}`} aria-pressed={on} aria-label={on ? labels.added : labels.add} title={on ? labels.added : labels.add}>{icon}</button>
        {note && <span className="bookmark-note" role="status">{note}</span>}
      </span>
    );
  }
  const base = variant === "chip" ? "chip" : "inline-flex items-center gap-2 rounded-button px-4 py-2.5 text-body-sm font-bold transition-colors";
  const tone = variant === "chip" ? (on ? "is-on" : "") : on ? "bg-eco-500 text-white hover:bg-eco-600" : "border border-white/25 hover:border-signal-300";
  return (
    <span className="relative inline-flex">
      <button type="button" onClick={click} className={`${base} ${tone} ${className}`} aria-pressed={on}>{icon}{on ? labels.added : labels.add}</button>
      {note && <span className="bookmark-note" role="status">{note}</span>}
    </span>
  );
}
