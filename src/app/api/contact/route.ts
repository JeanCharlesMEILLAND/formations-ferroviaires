import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { CONTACT_EMAIL, isContactKind } from "@/lib/contact";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { fiche: "Mise à jour d'une fiche", erreur: "Signalement d'une erreur", nouveau: "Proposition d'établissement", autre: "Autre demande" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Cinq messages par adresse et par dix minutes (mémoire de l'instance : protection simple contre les rafales).
const sent = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const list = (sent.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (list.length >= 5) { sent.set(ip, list); return true; }
  list.push(now); sent.set(ip, list);
  return false;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid" }, { status: 400 }); }

  // Pot de miel : un robot qui remplit « website » reçoit un faux succès.
  if (clean(body.website, 10)) return NextResponse.json({ ok: true });
  if (tooMany(ip)) return NextResponse.json({ error: "rate" }, { status: 429 });

  const kind = body.kind;
  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const organisation = clean(body.organisation, 200) || null;
  const message = clean(body.message, 4000);
  const pageUrl = clean(body.pageUrl, 500) || null;
  const establishmentSlug = clean(body.establishmentSlug, 200) || null;
  const establishmentText = clean(body.establishment, 200) || null;

  const errors: Record<string, string> = {};
  if (!isContactKind(kind)) errors.kind = "required";
  if (name.length < 2) errors.name = "required";
  if (!EMAIL_RE.test(email)) errors.email = "invalidEmail";
  if (message.length < 10) errors.message = "tooShort";
  if (Object.keys(errors).length) return NextResponse.json({ error: "validation", errors }, { status: 400 });

  // Établissement : on retrouve la fiche par son slug ou par son nom exact, sinon on garde le texte saisi.
  let establishmentName = establishmentText;
  let slug = establishmentSlug;
  if (slug || establishmentText) {
    // Saisie libre « Nom (Ville) » : on sépare le nom de la ville avant de chercher.
    const m = /^(.*?)\s*\(([^()]+)\)\s*$/.exec(establishmentText ?? "");
    const nameText = (m ? m[1] : establishmentText ?? "").trim();
    const cityText = m ? m[2].trim() : null;
    const est = await prisma.establishment.findFirst({
      where: slug
        ? { slug }
        : { name: { equals: nameText, mode: "insensitive" }, ...(cityText ? { city: { equals: cityText, mode: "insensitive" } } : {}) },
      select: { slug: true, name: true, city: true },
    }).catch(() => null);
    if (est) { slug = est.slug; establishmentName = `${est.name} (${est.city})`; } else slug = null;
  }

  const row = await prisma.contactMessage.create({
    data: { kind: kind as string, name, email, organisation, establishmentSlug: slug, establishmentName, message, pageUrl },
    select: { id: true, createdAt: true },
  });

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://formations-ferroviaires.vercel.app";
  const text = [
    `${KIND_LABEL[kind as string]} reçue via ${base}/fr/contact`,
    "",
    `Nom : ${name}`,
    `Courriel : ${email}`,
    organisation ? `Organisme : ${organisation}` : null,
    establishmentName ? `Établissement : ${establishmentName}${slug ? ` → ${base}/fr/etablissement/${slug}` : ""}` : null,
    pageUrl ? `Page d'origine : ${pageUrl}` : null,
    "",
    message,
    "",
    `Message n° ${row.id} · à traiter dans ${base}/admin (onglet Messages)`,
  ].filter((l) => l !== null).join("\n");
  const mailed = await sendMail({ subject: `[Formations ferroviaires] ${KIND_LABEL[kind as string]} — ${name}`, text, replyTo: email, to: process.env.CONTACT_TO || CONTACT_EMAIL });

  return NextResponse.json({ ok: true, id: row.id, mailed });
}
