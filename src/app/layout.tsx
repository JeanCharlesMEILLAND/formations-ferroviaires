import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const heading = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "700", "800"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["500", "600"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://formations-ferroviaires.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Formations ferroviaires, le guide des métiers du rail",
    template: "%s · Formations ferroviaires",
  },
  description:
    "Trouvez où se former aux métiers du rail, près de chez vous : établissements vérifiés, formations du CAP à l'ingénieur, certifications EPSF, avec la source officielle.",
  openGraph: {
    type: "website",
    siteName: "Formations ferroviaires",
    locale: "fr_FR",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${heading.variable} ${body.variable} ${mono.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  );
}
