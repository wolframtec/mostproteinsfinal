import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductPageClient from '@/components/ProductPageClient';
import { PRODUCTS } from '@/data/products';

const siteUrl = 'https://mostproteins.com';
const siteName = 'Most Proteins';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const getProduct = (slug: string) => PRODUCTS.find((product) => product.id === slug);

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.id }));
}

// Product-specific keywords mapping
const productKeywords: Record<string, string[]> = {
  'bpc-157': [
    'BPC-157 peptide',
    'BPC 157 research',
    'pentadecapeptide',
    'tissue repair research',
    'BPC-157 5mg',
    'synthetic peptide',
    'laboratory peptide',
    'BPC157 CAS 137525-51-0',
  ],
  'ghk-cu': [
    'GHK-Cu peptide',
    'copper tripeptide',
    'GHK Cu research',
    'extracellular matrix',
    'GHK-Cu 50mg',
    'copper peptide research',
    'glycyl-L-histidyl-L-lysine',
    'GHK-Cu CAS 89030-95-5',
  ],
  'epithalon': [
    'Epithalon peptide',
    'Epitalon research',
    'telomerase peptide',
    'synthetic tetrapeptide',
    'Epithalon 20mg',
    'Ala-Glu-Asp-Gly',
    'aging research peptide',
    'Epithalon CAS 307297-39-8',
  ],
  'tb-500': [
    'TB-500 peptide',
    'Thymosin Beta-4',
    'TB 500 research',
    'actin regulation',
    'TB-500 5mg',
    'thymosin fragment',
    'tissue research peptide',
    'TB-500 CAS 885340-08-9',
  ],
  'cjc-ghrp': [
    'CJC-1295 GHRP-2 blend',
    'CJC 1295 research',
    'GHRP-2 peptide',
    'growth hormone secretagogue',
    'CJC GHRP blend 10mg',
    'GHRH research',
    'modified GRF 1-29',
    'peptide blend research',
  ],
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  const keywords = productKeywords[product.id] || [];
  const description = `${product.description} HPLC-tested research compound with Certificate of Analysis. For laboratory research use only. 21+ required.`;
  const url = `${siteUrl}/product/${product.id}/`;
  const imageUrl = product.image.startsWith('http')
    ? product.image
    : `${siteUrl}${product.image}`;

  return {
    title: `${product.name} | Research Peptide`,
    description,
    keywords: [
      ...keywords,
      'research peptide',
      'HPLC purity',
      'COA included',
      'laboratory grade',
      'research only',
    ],
    alternates: { canonical: `/product/${product.id}/` },
    openGraph: {
      title: `${product.name} | Research Peptide`,
      description,
      type: 'website',
      url,
      siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${product.name} - Research peptide with HPLC purity ≥${product.purity}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Research Peptide`,
      description,
      images: [imageUrl],
    },
    other: {
      'product:price:amount': product.price.toFixed(2),
      'product:price:currency': 'USD',
      'product:availability': 'in stock',
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

  // Enhanced Product Schema
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
      caption: `${product.name} - Research peptide`,
    },
    description: product.description,
    sku: product.id.toUpperCase(),
    mpn: product.casNumber,
    brand: {
      '@type': 'Brand',
      name: siteName,
      url: siteUrl,
    },
    manufacturer: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
    },
    offers: {
      '@type': 'Offer',
      name: product.name,
      price: product.price.toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: `${siteUrl}/product/${product.id}/`,
      seller: {
        '@type': 'Organization',
        name: siteName,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: 'USD',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'US',
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
        applicableCountry: 'US',
        returnPolicyCountry: 'US',
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'CAS Number',
        value: product.casNumber,
      },
      {
        '@type': 'PropertyValue',
        name: 'Molecular Weight',
        value: product.molecularWeight,
      },
      {
        '@type': 'PropertyValue',
        name: 'Purity',
        value: product.purity,
      },
      {
        '@type': 'PropertyValue',
        name: 'Storage',
        value: product.storage,
      },
      {
        '@type': 'PropertyValue',
        name: 'Sequence',
        value: product.sequence,
      },
    ],
    audience: {
      '@type': 'Audience',
      audienceType: 'Research Laboratories',
      geographicArea: {
        '@type': 'Country',
        name: 'United States',
      },
    },
    material: 'Lyophilized peptide powder',
  };

  // Breadcrumb Schema
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${siteUrl}/#products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${siteUrl}/product/${product.id}/`,
      },
    ],
  };

  return (
    <>
      <ProductPageClient product={product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
