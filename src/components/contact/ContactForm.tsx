"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { CONTACT_KINDS, type ContactKind } from "@/lib/contact";
import { displayName } from "@/lib/format";

type Est = { slug: string; name: string; city: string };
type Field = "name" | "email" | "message" | "kind";

const KIND_ICON: Record<ContactKind, string> = {
  fiche: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  erreur: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  nouveau: "M12 5v14M5 12h14",
  autre: "M21 12a8 8 0 0 1-11.6 7.2L4 21l1.8-5.4A8 8 0 1 1 21 12z",
};

/** Formulaire de contact : motif, coordonnées, établissement concerné, message ; envoi vers /api/contact. */
export default function ContactForm({
  dict, locale, establishments, initialKind, initialEstablishment,
}: { dict: Dictionary["contact"]; locale: Locale; establishments: Est[]; initialKind?: ContactKind; initialEstablishment?: Est }) {
  const id = useId();
  const [kind, setKind] = useState<ContactKind | "">(initialKind ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [establishment, setEstablishment] = useState(initialEstablishment ? `${displayName(initialEstablishment.name)} (${initialEstablishment.city})` : "");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // pot de miel, jamais affiché
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "rate">("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const options = useMemo(() => establishments.map((e) => ({ ...e, label: `${displayName(e.name)} (${e.city})` })), [establishments]);
  const matched = options.find((o) => o.label.toLowerCase() === establishment.trim().toLowerCase());
  const asksEstablishment = kind === "fiche" || kind === "erreur";

  const validate = () => {
    const e: Partial<Record<Field, string>> = {};
    if (!kind) e.kind = dict.required;
    if (name.trim().length < 2) e.name = dict.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = dict.invalidEmail;
    if (message.trim().length < 10) e.message = dict.tooShort;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind, name, email, organisation, message, website,
          establishment: asksEstablishment ? establishment : "",
          establishmentSlug: asksEstablishment ? matched?.slug ?? "" : "",
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      if (r.status === 429) { setStatus("rate"); return; }
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        if (data?.errors) setErrors(Object.fromEntries(Object.entries(data.errors as Record<string, string>).map(([k, v]) => [k, dict[v as "required" | "invalidEmail" | "tooShort"] ?? dict.required])));
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="bg-white border border-navy-200 rounded-card p-8 text-center animate-rise" role="status">
        <span className="w-14 h-14 rounded-full bg-eco-50 text-eco-600 grid place-items-center mx-auto" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
        </span>
        <h2 className="font-heading text-h3 mt-4">{dict.successTitle}</h2>
        <p className="text-navy-600 mt-2 max-w-[48ch] mx-auto">{dict.successText}</p>
        <div className="flex flex-wrap justify-center gap-2.5 mt-6">
          <button type="button" onClick={() => { setStatus("idle"); setMessage(""); }} className="rounded-button bg-navy-900 text-white px-5 py-2.5 font-bold text-body-sm">{dict.another}</button>
          <Link href={`/${locale}`} className="rounded-button border border-navy-300 px-5 py-2.5 font-bold text-body-sm hover:border-navy-900">{dict.backHome}</Link>
        </div>
      </div>
    );
  }

  const input = "w-full h-12 px-4 rounded-xl border border-navy-200 bg-white text-navy-900 font-semibold focus:outline-none focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10 transition-shadow";
  const label = "block text-[11px] font-extrabold uppercase tracking-wider text-navy-500 mb-1.5";
  const err = (f: Field) => errors[f] && <p className="text-caption font-bold text-electric-600 mt-1" role="alert">{errors[f]}</p>;

  return (
    <form onSubmit={submit} noValidate className="bg-white border border-navy-200 rounded-card p-6 lg:p-8 flex flex-col gap-7">
      <fieldset>
        <legend className={label}>{dict.kindLabel}</legend>
        <div className="grid sm:grid-cols-2 gap-2.5" role="radiogroup">
          {CONTACT_KINDS.map((k) => (
            <label key={k} className={`kind-card ${kind === k ? "is-on" : ""}`}>
              <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
              <span className="kind-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d={KIND_ICON[k]} /></svg>
              </span>
              <span className="min-w-0">
                <span className="block font-heading font-bold text-[15px] leading-tight">{dict.kinds[k]}</span>
                <span className="block text-caption text-navy-500 mt-0.5">{dict.kindsHint[k]}</span>
              </span>
            </label>
          ))}
        </div>
        {err("kind")}
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${id}-name`} className={label}>{dict.name}</label>
          <input id={`${id}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className={input} aria-invalid={!!errors.name} />
          {err("name")}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className={label}>{dict.email}</label>
          <input id={`${id}-email`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={input} aria-invalid={!!errors.email} />
          {err("email")}
        </div>
        <div className={asksEstablishment ? "" : "sm:col-span-2"}>
          <label htmlFor={`${id}-org`} className={label}>{dict.organisation}</label>
          <input id={`${id}-org`} value={organisation} onChange={(e) => setOrganisation(e.target.value)} autoComplete="organization" className={input} />
        </div>
        {asksEstablishment && (
          <div>
            <label htmlFor={`${id}-est`} className={label}>{dict.establishment}</label>
            <input id={`${id}-est`} list={`${id}-list`} value={establishment} onChange={(e) => setEstablishment(e.target.value)} autoComplete="off" className={input} />
            <datalist id={`${id}-list`}>{options.map((o) => <option key={o.slug} value={o.label} />)}</datalist>
            <p className="text-caption text-navy-400 mt-1">
              {matched ? (
                <Link href={`/${locale}/etablissement/${matched.slug}`} target="_blank" className="font-bold text-eco-700 underline">✓ {matched.label}</Link>
              ) : dict.establishmentHint}
            </p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-msg`} className={label}>{dict.message}</label>
        <textarea id={`${id}-msg`} value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required className={`${input} h-auto py-3 leading-relaxed resize-y`} placeholder={kind ? dict.messageHint[kind] : undefined} aria-invalid={!!errors.message} />
        {err("message")}
      </div>

      {/* Champ piège pour les robots : invisible, ne doit pas être rempli */}
      <div className="absolute -left-[9999px] top-0" aria-hidden="true">
        <label htmlFor={`${id}-web`}>Site web</label>
        <input id={`${id}-web`} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {(status === "error" || status === "rate") && (
        <p role="alert" className="rounded-xl border border-electric-200 bg-electric-50 text-electric-800 px-4 py-3 text-body-sm font-semibold animate-rise">
          {status === "rate" ? dict.errorRate : dict.errorGeneric}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === "sending"} className="rounded-button bg-electric-500 hover:bg-electric-600 disabled:opacity-60 text-white px-7 py-3 font-extrabold text-body-sm transition-colors">
          {status === "sending" ? dict.sending : dict.send}
        </button>
        <span className="text-caption text-navy-400 max-w-[40ch]">{dict.privacy}</span>
      </div>
    </form>
  );
}
