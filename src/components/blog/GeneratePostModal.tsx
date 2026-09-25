import { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCreateBlogPost } from "@/hooks/useBlogPosts";
import { useToast } from "@/hooks/use-toast";

interface GeneratePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GeneratePostModal = ({ open, onOpenChange }: GeneratePostModalProps) => {
  const [category, setCategory] = useState("music-business");
  const [customTopic, setCustomTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const createPost = useCreateBlogPost();
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-post", {
        body: { category, customTopic: customTopic.trim() || undefined },
      });

      if (error) throw error;

      // Create the post with generated content - published immediately
      await createPost.mutateAsync({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt,
        category: data.category,
        tags: data.tags,
        seo_title: data.seoTitle,
        seo_description: data.seoDescription,
        read_time: data.readTime,
        featured_image: data.featuredImage || null,
        og_image: data.ogImage || null,
        is_ai_generated: true,
        status: "published",
        published_at: new Date().toISOString(),
      });

      toast({
        title: "Post generated!",
        description: "Your AI-generated post is ready for review.",
      });

      onOpenChange(false);
      setCustomTopic("");
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate post",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate AI Blog Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="music-business">Making Money in Music</SelectItem>
                <SelectItem value="industry-news">Music Industry News</SelectItem>
                <SelectItem value="ai-music">AI in Music</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="customTopic">Custom Topic (Optional)</Label>
            <Input
              id="customTopic"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="e.g., How to get your first sync placement"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty for the AI to pick a relevant topic
            </p>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Post
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
