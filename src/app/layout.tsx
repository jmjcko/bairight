import type { Metadata } from "next";
import { Space_Grotesk, Inter_Tight } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import { AuthProvider } from "@/lib/auth/AuthContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "bAIright | Univerzální AI nákupní poradce & prompt inženýr",
  description: "Nezávislý AI nákupní rádce, který vám pomůže vybrat ideální auto, boty, kávovar, kancelářskou židli nebo jakýkoliv produkt na míru vašim parametrům.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" data-theme="pixel-mint" data-design-system="executive-technical" data-font="space-grotesk" className={`dark ${spaceGrotesk.variable} ${interTight.variable}`}>
      <body className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-emerald-900 selection:text-white ${spaceGrotesk.className}`}>
        <I18nProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
