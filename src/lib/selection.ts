"use client";

import { useCallback, useEffect, useState } from "react";

/** Sélection d'établissements à comparer : mémorisée dans le navigateur, huit fiches au plus. */
export const SELECTION_KEY = "ff-selection";
export const SELECTION_MAX = 8;
const EVENT = "ff-selection-change";

export function readSelection(): string[] {
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s) => typeof s === "string").slice(0, SELECTION_MAX) : [];
  } catch { return []; }
}

export function writeSelection(slugs: string[]): void {
  try { localStorage.setItem(SELECTION_KEY, JSON.stringify(slugs.slice(0, SELECTION_MAX))); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useSelection() {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setSlugs(readSelection());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const toggle = useCallback((slug: string): "added" | "removed" | "full" => {
    const current = readSelection();
    if (current.includes(slug)) { writeSelection(current.filter((s) => s !== slug)); return "removed"; }
    if (current.length >= SELECTION_MAX) return "full";
    writeSelection([...current, slug]);
    return "added";
  }, []);
  const remove = useCallback((slug: string) => writeSelection(readSelection().filter((s) => s !== slug)), []);
  const clear = useCallback(() => writeSelection([]), []);
  const replace = useCallback((list: string[]) => writeSelection(list), []);
  return { slugs, count: slugs.length, has, toggle, remove, clear, replace, max: SELECTION_MAX };
}
