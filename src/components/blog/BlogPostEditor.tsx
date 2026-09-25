import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Eye, Sparkles, Upload, X, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateBlogPost, useUpdateBlogPost, type BlogPost, type CreateBlogPostData } from "@/hooks/useBlogPosts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { sanitizeHtml } from "@/lib/sanitize";

interface BlogPostEditorProps {
  post?: BlogPost | null;
  onClose: () => void;
}

export const BlogPostEditor = ({ post, onClose }: BlogPostEditorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();

  const [formData, setFormData] = useState<CreateBlogPostData>({
    title: "",
    content: "",
    excerpt: "",
    featured_image: "",
    category: "music-business",
    tags: [],
    status: "draft",
    author: "Joka Beatz",
    seo_title: "",
    seo_description: "",
    read_time: 5,
    is_ai_generated: false,
  });

  const [tagsInput, setTagsInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt || "",
        featured_image: post.featured_image || "",
        category: post.category,
        tags: post.tags || [],
        status: post.status,
        author: post.author || "Joka Beatz",
        seo_title: post.seo_title || "",
        seo_description: post.seo_description || "",
        read_time: post.read_time || 5,
        is_ai_generated: post.is_ai_generated || false,
      });
      setTagsInput(post.tags?.join(", ") || "");
    }
  }, [post]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    setFormData((prev) => ({ ...prev, featured_image: publicUrl }));
    setIsUploading(false);
    toast({ title: "Image uploaded successfully" });
  };

  const handleRegenerateImages = async () => {
    if (!post) {
      toast({ title: "Save the post first before regenerating images", variant: "destructive" });
      return;
    }

    setIsRegeneratingImages(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-blog-images", {
        body: {
          postId: post.id,
          title: formData.title,
          content: formData.content,
          generateInline: true,
        },
      });

      if (error) throw error;

      if (data.featuredImage) {
        setFormData((prev) => ({ ...prev, featured_image: data.featuredImage }));
      }
      if (data.content) {
        setFormData((prev) => ({ ...prev, content: data.content }));
      }

      // Invalidate queries to refresh the post list
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });

      toast({
        title: "Images regenerated!",
        description: `Generated ${data.featuredImage ? 1 : 0} featured image and ${data.inlineImages?.length || 0} inline images.`,
      });
    } catch (error) {
      console.error("Regenerate images error:", error);
      toast({
        title: "Failed to regenerate images",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingImages(false);
    }
  };

  const handleSubmit = async (publishNow: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    const status = publishNow ? "published" : formData.status;
    const published_at = publishNow && formData.status !== "published" 
      ? new Date().toISOString() 
      : post?.published_at;

    const data: CreateBlogPostData = {
      ...formData,
      tags,
      status,
      published_at,
    };

    if (post) {
      await updatePost.mutateAsync({ id: post.id, ...data });
    } else {
      await createPost.mutateAsync(data);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            {post ? "Edit Post" : "Create New Post"}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? "Edit" : "Preview"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {showPreview ? (
          /* Preview Mode */
          <div className="prose prose-lg prose-invert max-w-none bg-card p-8 rounded-lg border border-border">
            <h1>{formData.title || "Untitled Post"}</h1>
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.content || "<p>No content yet...</p>") }} />
          </div>
        ) : (
          /* Edit Mode */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter post title..."
                  className="text-lg"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief summary for listings..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="content">Content * (HTML supported)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Featured Image */}
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label className="mb-2 block">Featured Image</Label>
                {formData.featured_image ? (
                  <div className="relative">
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData((prev) => ({ ...prev, featured_image: "" }))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      {isUploading ? "Uploading..." : "Click to upload"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </label>
                )}
                {post && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={handleRegenerateImages}
                    disabled={isRegeneratingImages}
                  >
                    {isRegeneratingImages ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Images
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Category */}
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label className="mb-2 block">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music-business">Making Money</SelectItem>
                    <SelectItem value="industry-news">Industry News</SelectItem>
                    <SelectItem value="ai-music">AI in Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label htmlFor="tags" className="mb-2 block">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="music, production, tips"
                />
              </div>

              {/* Author */}
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label htmlFor="author" className="mb-2 block">Author</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                />
              </div>

              {/* Read Time */}
              <div className="bg-card p-4 rounded-lg border border-border">
                <Label htmlFor="read_time" className="mb-2 block">Read Time (minutes)</Label>
                <Input
                  id="read_time"
                  type="number"
                  value={formData.read_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, read_time: parseInt(e.target.value) || 5 }))}
                />
              </div>

              {/* SEO */}
              <div className="bg-card p-4 rounded-lg border border-border space-y-4">
                <h3 className="font-semibold">SEO Settings</h3>
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, seo_title: e.target.value }))}
                    placeholder="Custom title for search engines..."
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">Meta Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, seo_description: e.target.value }))}
                    placeholder="Description for search results..."
                    rows={3}
                  />
                </div>
              </div>

              {/* AI Generated Flag */}
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ai_generated" className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Generated
                  </Label>
                  <Switch
                    id="ai_generated"
                    checked={formData.is_ai_generated}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_ai_generated: checked }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={() => handleSubmit(true)}
                  disabled={createPost.isPending || updatePost.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {post?.status === "published" ? "Update" : "Publish Now"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSubmit(false)}
                  disabled={createPost.isPending || updatePost.isPending}
                >
                  Save as Draft
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
