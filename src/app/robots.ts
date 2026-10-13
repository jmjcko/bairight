import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bairight.pro';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/luke', '/luke-lab'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
