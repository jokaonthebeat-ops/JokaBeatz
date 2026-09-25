import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/hooks/useBlogPosts";
interface BlogCardProps {
  post: BlogPost;
}

const categoryLabels: Record<string, string> = {
  "music-business": "Making Money",
  "industry-news": "Industry News",
  "ai-music": "AI in Music",
};

const categoryColors: Record<string, string> = {
  "music-business": "bg-green-500/20 text-green-400 hover:bg-green-500/30",
  "industry-news": "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
  "ai-music": "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
};

export const BlogCard = ({ post }: BlogCardProps) => {
  const publishedDate = post.published_at 
    ? format(new Date(post.published_at), "MMM d, yyyy")
    : "Draft";

  return (
    <article className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 card-lift">
      {/* Featured Image */}
      <Link to={`/blog/${post.slug}`} className="block aspect-video overflow-hidden">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
            <span className="text-4xl">🎵</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5">
        {/* Category Badge */}
        <Badge className={`mb-3 ${categoryColors[post.category] || "bg-secondary"}`}>
          {categoryLabels[post.category] || post.category}
        </Badge>

        {/* Title */}
        <Link to={`/blog/${post.slug}`}>
          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {publishedDate}
            </span>
            {post.read_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {post.read_time} min read
              </span>
            )}
          </div>
          <Link 
            to={`/blog/${post.slug}`}
            className="flex items-center gap-1 text-primary hover:underline font-medium"
          >
            Read <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
};
