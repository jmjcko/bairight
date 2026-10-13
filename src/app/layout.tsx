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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bairight.pro';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "bAIright | Univerzální AI nákupní poradce & prompt inženýr",
    template: "%s | bAIright",
  },
  description: "Nezávislý AI nákupní rádce, který vám pomůže vybrat ideální auto, boty, kávovar, kancelářskou židli nebo jakýkoliv produkt na míru vašim parametrům.",
  keywords: [
    "AI nákupní poradce",
    "AI shopping consultant",
    "prompt inženýr",
    "objektivní nákupní rádce",
    "výběr produktů",
    "bAIright",
    "nákupní asistent",
    "prompt engineering",
    "výběr bot",
    "výběr kancelářské židle",
    "výběr kávovaru",
  ],
  authors: [{ name: "bAIright Team" }],
  creator: "bAIright",
  publisher: "bAIright",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      cs: "/",
      en: "/",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    alternateLocale: ["en_US"],
    url: baseUrl,
    siteName: "bAIright",
    title: "bAIright | Univerzální AI nákupní poradce & prompt inženýr",
    description: "Nezávislý AI nákupní rádce, který vám pomůže vybrat ideální produkt na míru vašim parametrům bez sponzorovaných manipulací.",
    images: [
      {
        url: "/images/bairight-logotype-4c.png",
        width: 1200,
        height: 630,
        alt: "bAIright | Univerzální AI nákupní poradce & prompt inženýr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bAIright | Univerzální AI nákupní poradce & prompt inženýr",
    description: "Nezávislý AI nákupní rádce a prompt inženýr pro objektivní výběr produktů.",
    images: ["/images/bairight-logotype-4c.png"],
  },
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

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${baseUrl}/#webapp`,
      name: "bAIright",
      url: baseUrl,
      applicationCategory: "ShoppingApplication",
      operatingSystem: "All",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
      description: "Univerzální AI nákupní poradce a prompt inženýr pro objektivní výběr libovolného produktu na míru parametrům uživatele.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "CZK",
      },
    },
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "bAIright",
      url: baseUrl,
      logo: `${baseUrl}/icon-512.png`,
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="google-material" data-design-system="material-admin" data-font="inter-tight" className={`material-mode ${spaceGrotesk.variable} ${interTight.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('bairight_color_mode');var dark=m==='dark'||(!m||m==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-color-mode',dark?'dark':'light');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
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
