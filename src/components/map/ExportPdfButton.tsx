"use client";

import { useState } from "react";

/** « Emporter la liste (PDF) » : demande le document au serveur et déclenche le téléchargement, sans ouvrir d'onglet. */
const MAX = 150;

export default function ExportPdfButton({ slugs, locale, title, subtitle, label, hint, busyLabel }: { slugs: string[]; locale: string; title: string; subtitle: string; label: string; hint: string; busyLabel: string }) {
  const [busy, setBusy] = useState(false);
  const list = slugs.slice(0, MAX);
  const download = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/selection/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ s: list.join(","), locale, mode: "list", title, subtitle }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const name = /filename="([^"]+)"/.exec(r.headers.get("content-disposition") || "")?.[1] || "formations-ferroviaires-liste.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error(err);
      // repli : le serveur répond en téléchargement direct
      window.open(`/api/selection/pdf?mode=list&locale=${locale}&s=${encodeURIComponent(list.slice(0, 40).join(","))}&title=${encodeURIComponent(title)}`, "_blank", "noopener");
    } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={download} disabled={busy} className="chip" title={hint.replace("{n}", String(Math.min(MAX, slugs.length)))}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
      {busy ? busyLabel : label}
    </button>
  );
}
