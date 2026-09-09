import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter-tight',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'bAIright | Nakupujte správně s AI • Osobní podiatrický nákupčí bot',
  description: 'Inteligentní systém pro výběr správné obuvi s využitím AI agentů, biomechaniky došlapu a prevence kloubních potíží.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className={`dark ${interTight.variable}`}>
      <body className={`min-h-screen bg-[#070d18] text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950 ${interTight.className}`}>
        {children}
      </body>
    </html>
  );
}
