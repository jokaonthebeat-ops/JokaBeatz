import { Helmet } from "react-helmet-async";

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  socialProfiles?: string[];
}

export const OrganizationSchema = ({
  name = "Joka Beatz",
  url = "https://jokabeatz.com",
  logo = "https://jokabeatz.com/joka-beatz-logo.png",
  description = "Professional music producer offering Hip Hop, Trap, R&B, and AfroBeat beats for sale. Custom production, mixing, mastering, and artist consultation services.",
  socialProfiles = [],
}: OrganizationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    sameAs: socialProfiles,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@jokabeatz.com",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface MusicGroupSchemaProps {
  name?: string;
  url?: string;
  genre?: string[];
  description?: string;
}

export const MusicGroupSchema = ({
  name = "Joka Beatz",
  url = "https://jokabeatz.com",
  genre = ["Hip Hop", "Trap", "R&B", "AfroBeat", "Pop"],
  description = "Professional music producer creating industry-ready beats for artists worldwide.",
}: MusicGroupSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name,
    url,
    genre,
    description,
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: "Beat Production",
        description: "Custom beat production and licensing for artists",
      },
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface WebSiteSchemaProps {
  name?: string;
  url?: string;
  description?: string;
}

export const WebSiteSchema = ({
  name = "Joka Beatz",
  url = "https://jokabeatz.com",
  description = "Buy professional beats online. Hip Hop, Trap, R&B, and AfroBeat instrumentals for sale.",
}: WebSiteSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${url}/beats?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface LocalBusinessSchemaProps {
  name?: string;
  url?: string;
  email?: string;
  priceRange?: string;
}

export const LocalBusinessSchema = ({
  name = "Joka Beatz",
  url = "https://jokabeatz.com",
  email = "contact@jokabeatz.com",
  priceRange = "$$ - $$$",
}: LocalBusinessSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": url,
    name,
    url,
    email,
    priceRange,
    image: "https://jokabeatz.com/joka-beatz-logo.png",
    description: "Professional music production studio offering beats, mixing, mastering, and consultation services.",
    areaServed: {
      "@type": "Country",
      name: "Worldwide",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Music Production Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Beat Licensing",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Custom Beat Production",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Mixing Services",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Mastering Services",
          },
        },
      ],
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
