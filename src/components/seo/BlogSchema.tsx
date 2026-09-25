import { Helmet } from "react-helmet-async";

interface BlogPostSchemaProps {
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  modifiedAt: string;
  image?: string;
  url: string;
}

export const BlogPostSchema = ({
  title,
  description,
  author,
  publishedAt,
  modifiedAt,
  image,
  url,
}: BlogPostSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "Joka Beatz",
      logo: {
        "@type": "ImageObject",
        url: "https://jokabeatz.com/joka-beatz-logo.png",
      },
    },
    datePublished: publishedAt,
    dateModified: modifiedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(image && {
      image: {
        "@type": "ImageObject",
        url: image,
      },
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface BlogListSchemaProps {
  posts: Array<{
    title: string;
    url: string;
  }>;
}

export const BlogListSchema = ({ posts }: BlogListSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Joka Beatz Blog",
    description: "Tips and tricks for artists to make money in music, industry news, and AI music updates.",
    url: "https://jokabeatz.com/blog",
    publisher: {
      "@type": "Organization",
      name: "Joka Beatz",
    },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: post.url,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};
