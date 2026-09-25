import { Helmet } from "react-helmet-async";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { usePageSeoSettings } from "@/hooks/usePageSeoSettings";

interface DynamicSeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  path?: string;
}

export const DynamicSeo = ({
  title,
  description,
  keywords,
  ogImage,
  ogType = "website",
  path = "",
}: DynamicSeoProps) => {
  const { data: settings } = useSiteSettings();
  const { data: pageSettings } = usePageSeoSettings(path);

  // Priority: props > page-specific settings > global site settings > defaults
  const seoTitle = title || pageSettings?.seo_title || settings?.seo_title || "Joka Beatz";
  const seoDescription = description || pageSettings?.seo_description || settings?.seo_description || "";
  const seoKeywords = keywords || pageSettings?.seo_keywords || settings?.seo_keywords || "";
  // Use page-specific og_image; only fall back to the global site og_image on the home page
  // so other pages don't accidentally reuse the home image.
  const isHome = !path || path === "/" || path === "";
  const seoOgImage =
    ogImage ||
    pageSettings?.og_image ||
    (isHome ? settings?.og_image : "") ||
    "";
  const twitterHandle = settings?.twitter_handle || "@JokaBeatz";
  const themeColor = settings?.theme_color || "#DC2626";
  const siteUrl = settings?.site_url || "https://jokabeatz.com";
  const fullUrl = `${siteUrl}${path}`;

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <meta name="theme-color" content={themeColor} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullUrl} />
      {seoOgImage && <meta property="og:image" content={seoOgImage} />}
      <meta property="og:site_name" content="Joka Beatz" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      {seoOgImage && <meta name="twitter:image" content={seoOgImage} />}
    </Helmet>
  );
};
