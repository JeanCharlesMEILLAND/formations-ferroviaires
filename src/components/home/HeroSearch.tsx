"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import SearchField from "@/components/map/SearchField";
import { buildSuggestionItems, suggest, type SearchIndexData, type SuggestionItem, type SuggestionKind } from "@/lib/search";
import { displayName } from "@/lib/format";

/** Barre de recherche du hero : étiquette vivante, suggestions dès la frappe, envoi vers /carte. */
export default function HeroSearch({
  action, label, suggestions, nearHref, nearLabel, submitLabel, kindLabels,
}: { action: string; label: string; suggestions: string[]; nearHref: string; nearLabel: string; submitLabel: string; kindLabels: Record<SuggestionKind, string> }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [items, setItems] = useState<SuggestionItem[] | null>(null);
  const loading = useRef(false);

  // L'index se charge à la première frappe, une seule fois (réponse mise en cache au CDN).
  const ensureIndex = useCallback(() => {
    if (items || loading.current) return;
    loading.current = true;
    fetch("/api/search-index")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: SearchIndexData | null) => { if (d) setItems(buildSuggestionItems(d, displayName)); })
      .catch(() => {})
      .finally(() => { loading.current = false; });
  }, [items]);

  const go = () => router.push(`${action}?q=${encodeURIComponent(value.trim())}`);
  const pick = (item: SuggestionItem) => {
    if (item.kind === "formation") router.push(`${action}?formation=${encodeURIComponent(item.slug)}`);
    else if (item.kind === "metier") router.push(`${action}?metier=${encodeURIComponent(item.slug)}`);
    else router.push(`${action}?q=${encodeURIComponent(item.label)}`);
  };

  return (
    <form action={action} method="get" role="search" onSubmit={(e) => { e.preventDefault(); if (value.trim()) go(); else router.push(action); }} className="flex flex-wrap gap-2 items-center bg-white rounded-2xl p-2 shadow-search relative z-20">
      {/* Sur mobile, le champ prend toute la ligne et les boutons passent dessous : l'exemple tapé garde sa place */}
      <div className="flex-1 min-w-[14rem] basis-full sm:basis-0">
        <SearchField
          value={value}
          onChange={(v) => { setValue(v); ensureIndex(); }}
          label={label}
          suggestions={suggestions}
          hero
          suggest={(q) => (items ? suggest(items, q, 9) : [])}
          onPick={pick}
          onSubmit={() => { if (value.trim()) go(); }}
          kindLabels={kindLabels}
        />
      </div>
      {/* Icône seule sous 2xl : la place va à l'étiquette animée du champ, qui sinon se coupe */}
      <Link href={nearHref} aria-label={nearLabel} title={nearLabel} className="inline-flex items-center gap-1.5 rounded-xl bg-navy-100 text-navy-900 px-3 py-2.5 text-body-sm font-bold whitespace-nowrap hover:bg-navy-200 transition-colors">
        <span aria-hidden="true">◎</span><span className="hidden 2xl:inline">{nearLabel}</span>
      </Link>
      <button type="submit" className="flex-1 sm:flex-none rounded-xl bg-electric-500 hover:bg-electric-600 text-white px-5 py-3 text-body-sm font-extrabold transition-colors">
        {submitLabel}
      </button>
    </form>
  );
}
