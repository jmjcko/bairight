import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'bAIright | Univerzální AI nákupní poradce',
    short_name: 'bAIright',
    description: 'Nezávislý AI nákupní rádce a generátor nákupních promptů na míru vašim parametrům.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070d18',
    theme_color: '#f4f6f8',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
