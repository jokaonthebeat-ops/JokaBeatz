import { Helmet } from "react-helmet-async";

interface ProductSchemaProps {
  name: string;
  description: string;
  price: number;
  currency?: string;
  image?: string;
  images?: string[];
  url?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  category?: string;
  brand?: string;
  sku?: string;
}

export const ProductSchema = ({
  name,
  description,
  price,
  currency = "USD",
  image,
  images,
  url,
  availability = "InStock",
  category,
  brand = "Joka Beatz",
  sku,
}: ProductSchemaProps) => {
  const imageList = (images && images.length ? images : image ? [image] : []).filter(Boolean);
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    ...(imageList.length ? { image: imageList } : {}),
    url,
    category,
    ...(sku ? { sku } : {}),
    brand: {
      "@type": "Brand",
      name: brand,
    },
    offers: {
      "@type": "Offer",
      ...(url ? { url } : {}),
      price: Number(price).toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      priceValidUntil,
      seller: {
        "@type": "Organization",
        name: brand,
      },
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface ServiceSchemaProps {
  name: string;
  description: string;
  provider?: string;
  areaServed?: string;
  serviceType?: string;
}

export const ServiceSchema = ({
  name,
  description,
  provider = "Joka Beatz",
  areaServed = "Worldwide",
  serviceType,
}: ServiceSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType,
    provider: {
      "@type": "Organization",
      name: provider,
    },
    areaServed: {
      "@type": "Country",
      name: areaServed,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface MultipleServicesSchemaProps {
  services: Array<{
    name: string;
    description: string;
    serviceType?: string;
  }>;
  provider?: string;
}

export const MultipleServicesSchema = ({
  services,
  provider = "Joka Beatz",
}: MultipleServicesSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        serviceType: service.serviceType,
        provider: {
          "@type": "Organization",
          name: provider,
        },
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export default ProductSchema;
