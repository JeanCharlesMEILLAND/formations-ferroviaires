/** Formulaire de contact : motifs et adresse de réception. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@objectif-ofp.org";
export const CONTACT_KINDS = ["fiche", "erreur", "nouveau", "autre"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];
export const isContactKind = (v: unknown): v is ContactKind => typeof v === "string" && (CONTACT_KINDS as readonly string[]).includes(v);
