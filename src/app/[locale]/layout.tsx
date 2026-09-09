import { locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const dict = await getDictionary(params.locale);

  return (
    <div className="min-h-screen flex flex-col bg-navy-50 text-navy-900">
      <Header locale={params.locale} dict={dict} />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer locale={params.locale} dict={dict} />
    </div>
  );
}
