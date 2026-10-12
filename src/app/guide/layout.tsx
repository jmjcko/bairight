import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Produktový průvodce & manifest',
  description: 'Zjistěte, jak bAIright objektivně analyzuje fyzické, technické a ergonomické parametry produktů bez sponzorovaných odkazů a reklam.',
  alternates: {
    canonical: '/guide',
  },
  openGraph: {
    title: 'Produktový průvodce & manifest | bAIright',
    description: 'Zjistěte, jak bAIright objektivně analyzuje fyzické, technické a ergonomické parametry produktů bez sponzorovaných odkazů a reklam.',
    url: '/guide',
    type: 'article',
    images: [
      {
        url: '/images/guide-steps/step1-query-selection.png',
        width: 1200,
        height: 675,
        alt: 'bAIright Produktový průvodce a ukázka v akci',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Produktový průvodce & manifest | bAIright',
    description: 'Objektivní AI nákupní analýza parametrů bez reklam a sponzorovaných manipulací.',
    images: ['/images/guide-steps/step1-query-selection.png'],
  },
};

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
