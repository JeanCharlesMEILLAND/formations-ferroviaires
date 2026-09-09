import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://formations-ferroviaires.vercel.app";
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/fr`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/fr/carte`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/fr/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/en`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const establishments = await prisma.establishment.findMany({
      where: { source: { not: "api" } },
      select: { slug: true },
    });
    for (const e of establishments) {
      pages.push({ url: `${base}/fr/etablissement/${e.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.6 });
    }
  } catch {
    // base indisponible : on livre au moins les pages principales
  }
  return pages;
}
