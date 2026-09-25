import { useBlogPosts } from "@/hooks/useBlogPosts";
import { BlogCard } from "./BlogCard";

interface RelatedPostsProps {
  currentSlug: string;
  category: string;
}

export const RelatedPosts = ({ currentSlug, category }: RelatedPostsProps) => {
  const { data: posts } = useBlogPosts({ category, status: "published", limit: 4 });

  const relatedPosts = posts?.filter((post) => post.slug !== currentSlug).slice(0, 3);

  if (!relatedPosts || relatedPosts.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-8">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
};
