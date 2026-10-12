import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luke Consistency Lab (Internal)',
  description: 'Interní neindexovaná laboratoř pro testování a ověřování sémantické konzistence Agenta Lukea bez mezipaměti.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
};

export default function LukeLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
