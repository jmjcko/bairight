import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter_Tight } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/I18nContext";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f6f8",
};

export const metadata: Metadata = {
  title: "bAIright | Univerzální AI nákupní poradce & prompt inženýr",
  description: "Nezávislý AI nákupní rádce, který vám pomůže vybrat ideální auto, boty, kávovar, kancelářskou židli nebo jakýkoliv produkt na míru vašim parametrům.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="google-material" data-design-system="material-admin" data-font="inter-tight" className={`material-mode ${spaceGrotesk.variable} ${interTight.variable}`}>
      <body suppressHydrationWarning className={`min-h-screen material-mode bg-[#f4f6f8] text-[#263238] antialiased selection:bg-[#b3e5fc] selection:text-[#014377] ${interTight.className}`}>
        <I18nProvider>
          <AuthProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
