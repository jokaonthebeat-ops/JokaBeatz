import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Clock, ArrowLeft, Share2, Twitter, Facebook, Linkedin, MessageSquare } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { sanitizeHtml } from "@/lib/sanitize";
import { getBlogShareContent } from "@/lib/shareContent";
import { useBlogPost } from "@/hooks/useBlogPosts";
import { useCommentCount } from "@/hooks/useBlogComments";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { BlogServiceCTAs } from "@/components/blog/BlogServiceCTAs";
import { BlogComments } from "@/components/blog/BlogComments";
import { BlogPostSchema } from "@/components/seo/BlogSchema";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getShareUrls, openShareWindow } from "@/hooks/useShareUrl";

const categoryLabels: Record<string, string> = {
  "music-business": "Making Money",
  "industry-news": "Industry News",
  "ai-music": "AI in Music",
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useBlogPost(slug || "");
  const { data: commentCount = 0 } = useCommentCount(post?.id || "");

  // Get OG-enabled share URL for proper social media previews
  const { shareUrl } = getShareUrls(`/blog/${slug}`);
  
  // Generate caption and hashtags for sharing
  const shareContent = post 
    ? getBlogShareContent(post.title, post.category, post.excerpt)
    : { caption: "", hashtags: [] };

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    openShareWindow(platform, shareUrl, post?.title || "", shareContent.caption, shareContent.hashtags);
  };

  if (isLoading) {
    return (
      <Layout path="/blog">
        <article className="py-20 md:py-28 min-h-screen">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-6 w-48 mb-8" />
            <Skeleton className="aspect-video w-full mb-8 rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </article>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout path="/blog">
        <section className="py-20 md:py-28 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </section>
      </Layout>
    );
  }

  const publishedDate = post.published_at 
    ? format(new Date(post.published_at), "MMMM d, yyyy")
    : "Draft";

  return (
    <Layout 
      path={`/blog/${post.slug}`}
      seoTitle={post.seo_title || post.title}
      seoDescription={post.seo_description || post.excerpt || ""}
      ogImage={post.featured_image || undefined}
      ogType="article"
    >
      <BlogPostSchema
        title={post.title}
        description={post.seo_description || post.excerpt || ""}
        author={post.author || "Joka Beatz"}
        publishedAt={post.published_at || post.created_at}
        modifiedAt={post.updated_at}
        image={post.featured_image || undefined}
        url={`https://jokabeatz.com/blog/${post.slug}`}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Blog", url: "https://jokabeatz.com/blog" },
          { name: post.title, url: `https://jokabeatz.com/blog/${post.slug}` },
        ]}
      />

      <article className="py-20 md:py-28 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Link */}
          <Link 
            to="/blog" 
            className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <Badge className="mb-4">
              {categoryLabels[post.category] || post.category}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {publishedDate}
              </span>
              {post.read_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.read_time} min read
                </span>
              )}
              <span>By {post.author || "Joka Beatz"}</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {commentCount} {commentCount === 1 ? "comment" : "comments"}
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="mb-10 rounded-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10" />
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}

          {/* Content */}
          <div 
            className="blog-content max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />

          {/* Service CTAs */}
          <BlogServiceCTAs content={post.content} title={post.title} category={post.category} />

          {/* Share Buttons */}
          <div className="border-t border-border pt-8 mb-8">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 className="w-4 h-4" />
                Share this article:
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("twitter")}
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("facebook")}
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("linkedin")}
                  aria-label="Share on LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Comments Section */}
          <BlogComments postId={post.id} />

          {/* Related Posts */}
          <RelatedPosts currentSlug={post.slug} category={post.category} />
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
