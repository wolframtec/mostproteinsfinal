import { MetadataRoute } from 'next';
import { PRODUCTS } from '@/data/products';

export const dynamic = 'force-static';

const siteUrl = 'https://mostproteins.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Static pages with priorities
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/terms/`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy/`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Product pages with priorities
  const productPages: MetadataRoute.Sitemap = PRODUCTS.map((product) => ({
    url: `${siteUrl}/product/${product.id}/`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...productPages];
}
