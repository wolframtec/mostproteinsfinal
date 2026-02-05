import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductPageClient from '@/components/ProductPageClient';
import { PRODUCTS } from '@/data/products';

const siteUrl = 'https://mostproteins.com';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const getProduct = (slug: string) => PRODUCTS.find((product) => product.id === slug);

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  const description = product.description;
  const url = `${siteUrl}/product/${product.id}`;
  const imageUrl = product.image.startsWith('http')
    ? product.image
    : `${siteUrl}${product.image}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      url,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const imageUrl = product.image.startsWith('http')
    ? product.image
    : `${siteUrl}${product.image}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [imageUrl],
    description: product.description,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'Most Proteins',
    },
    offers: {
      '@type': 'Offer',
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/product/${product.id}`,
    },
  };

  return (
    <>
      <ProductPageClient product={product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </>
  );
}
