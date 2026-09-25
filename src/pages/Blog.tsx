import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFilters } from "@/components/blog/BlogFilters";
import { BlogListSchema } from "@/components/seo/BlogSchema";
import { Skeleton } from "@/components/ui/skeleton";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { getPageShareContent } from "@/lib/shareContent";

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts, isLoading } = useBlogPosts({ status: "published" });

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    
    return posts.filter((post) => {
      const matchesCategory = !selectedCategory || post.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const schemaData = posts?.map((post) => ({
    title: post.title,
    url: `https://jokabeatz.com/blog/${post.slug}`,
  })) || [];

  const blogShareContent = getPageShareContent("blog");

  return (
    <Layout 
      path="/blog"
      seoTitle="Blog | Music Industry Tips & News | Joka Beatz"
      seoDescription="Learn how to make money in music with tips, industry news, and AI music updates from Joka Beatz."
    >
      <BlogListSchema posts={schemaData} />
      
      <section className="py-20 md:py-28 min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              The Beat Blog
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tips and tricks for artists to make money in music, the latest industry news, 
              and updates on AI in music production.
            </p>
            <div className="mt-6">
              <ShareButtons 
                title="The Beat Blog | Joka Beatz" 
                path="/blog"
                caption={blogShareContent.caption}
                hashtags={blogShareContent.hashtags}
              />
            </div>
          </div>

          {/* Filters */}
          <BlogFilters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                  <Skeleton className="aspect-video" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                {searchQuery || selectedCategory 
                  ? "No posts found matching your criteria."
                  : "No blog posts yet. Check back soon!"}
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
