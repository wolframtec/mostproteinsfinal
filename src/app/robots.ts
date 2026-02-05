import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const siteUrl = 'https://mostproteins.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/checkout',
          '/checkout/',
          '/checkout/complete',
          '/checkout/complete/',
          '/api/',
          '/_next/',
          '/*.json$',
          '/*.xml$',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/checkout', '/checkout/'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/images/',
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
