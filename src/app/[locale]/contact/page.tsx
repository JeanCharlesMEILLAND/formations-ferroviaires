import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { prisma } from "@/lib/prisma";
import { CONTACT_EMAIL, isContactKind } from "@/lib/contact";
import ContactForm from "@/components/contact/ContactForm";

export const dynamic = "force-dynamic"; // le motif et l'établissement viennent de l'adresse

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  return {
    title: dict.contact.title,
    description: dict.contact.metaDescription,
    alternates: { canonical: `/${params.locale}/contact`, languages: { fr: "/fr/contact", en: "/en/contact" } },
  };
}

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ContactPage({ params, searchParams }: { params: { locale: Locale }; searchParams: Search }) {
  const dict = await getDictionary(params.locale);
  const c = dict.contact;
  const sujet = one(searchParams.sujet);
  const etab = one(searchParams.etablissement);
  const establishments = await prisma.establishment
    .findMany({ where: { source: { not: "api" } }, select: { slug: true, name: true, city: true }, orderBy: { name: "asc" } })
    .catch(() => [] as Array<{ slug: string; name: string; city: string }>);
  const initialEstablishment = etab ? establishments.find((e) => e.slug === etab) : undefined;
  const initialKind = isContactKind(sujet) ? sujet : initialEstablishment ? "fiche" : undefined;

  return (
    <>
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="max-w-content mx-auto px-container py-10 lg:py-14">
          <p className="font-mono text-caption font-bold uppercase tracking-[.16em] text-signal-300">{dict.meta.siteName}</p>
          <h1 className="font-heading text-h1 mt-2 text-balance">{c.title}</h1>
          <p className="text-body-lg text-navy-300 max-w-[62ch] mt-3">{c.lead}</p>
          <p className="text-body-sm text-navy-300 mt-4">
            {c.directMail} <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-white underline decoration-signal-300 underline-offset-4">{CONTACT_EMAIL}</a>
          </p>
        </div>
      </section>

      <section className="max-w-content mx-auto px-container py-10 lg:py-14 w-full">
        <div className="grid gap-8 lg:grid-cols-[1fr_.6fr] items-start">
          <ContactForm
            dict={c}
            locale={params.locale}
            establishments={establishments}
            initialKind={initialKind}
            initialEstablishment={initialEstablishment}
          />
          <aside className="lg:sticky lg:top-24">
            <div className="bg-white border border-navy-200 rounded-card p-6">
              <h2 className="font-heading text-h4">{c.howTitle}</h2>
              <ol className="mt-4 space-y-4">
                {c.how.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-signal-300 text-navy-900 font-mono font-bold text-caption grid place-items-center shrink-0" aria-hidden="true">{i + 1}</span>
                    <span className="text-body-sm text-navy-700 leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-caption text-navy-500 mt-4 px-1">{c.privacy}</p>
          </aside>
        </div>
      </section>
    </>
  );
}
