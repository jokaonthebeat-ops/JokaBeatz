import { useState } from "react";
import { useAllPageSeoSettings, useUpdatePageSeoSettings, PageSeoSettings } from "@/hooks/usePageSeoSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, FileText, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PageSeoManager = () => {
  const { data: pages, isLoading } = useAllPageSeoSettings();
  const updateSettings = useUpdatePageSeoSettings();
  const [editedPages, setEditedPages] = useState<Record<string, Partial<PageSeoSettings>>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const handleGenerateOGImage = async (page: PageSeoSettings, retryCount = 0) => {
    const maxRetries = 3;
    setGeneratingId(page.id);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const title = getFieldValue(page, "seo_title") || page.page_name;
      const tagline = getFieldValue(page, "seo_description");
      const imagePrompt = getFieldValue(page, "image_prompt");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-og-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ title, tagline, imagePrompt }),
        }
      );

      // Handle retryable errors (503, 502, network issues)
      if (response.status >= 500 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        toast({
          title: `Retrying... (${retryCount + 1}/${maxRetries})`,
          description: `AI service busy, waiting ${delay / 1000}s before retry`,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        setGeneratingId(null);
        return handleGenerateOGImage(page, retryCount + 1);
      }

      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate image (${response.status})`);
      }

      handleChange(page.id, "og_image", data.url);
      toast({
        title: "OG Image Generated",
        description: `Social preview image for ${page.page_name} is ready!`,
      });
    } catch (error) {
      console.error("Error generating OG image:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleChange = (pageId: string, field: keyof PageSeoSettings, value: string) => {
    setEditedPages((prev) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [field]: value,
      },
    }));
  };

  const getFieldValue = (page: PageSeoSettings, field: keyof PageSeoSettings): string => {
    const edited = editedPages[page.id];
    if (edited && field in edited) {
      return (edited[field] as string) || "";
    }
    return (page[field] as string) || "";
  };

  const handleSave = async (page: PageSeoSettings) => {
    const edited = editedPages[page.id];
    if (!edited) return;

    setSavingId(page.id);
    try {
      await updateSettings.mutateAsync({
        id: page.id,
        ...edited,
      });
      
      // Clear edited state for this page
      setEditedPages((prev) => {
        const next = { ...prev };
        delete next[page.id];
        return next;
      });
      
      toast({
        title: "Page SEO updated",
        description: `SEO settings for ${page.page_name} have been saved.`,
      });
    } catch (error) {
      toast({
        title: "Error saving",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const hasChanges = (pageId: string) => {
    return !!editedPages[pageId] && Object.keys(editedPages[pageId]).length > 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Page-Specific SEO
        </CardTitle>
        <CardDescription>
          Customize SEO metadata for each page individually
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-2">
          {pages?.map((page) => (
            <AccordionItem 
              key={page.id} 
              value={page.id}
              className="border border-border rounded-lg px-4 bg-secondary/30"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <span className="font-semibold text-foreground">{page.page_name}</span>
                  <span className="text-sm text-muted-foreground">{page.path}</span>
                  {hasChanges(page.id) && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      Unsaved
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`title-${page.id}`}>Page Title</Label>
                  <Input
                    id={`title-${page.id}`}
                    value={getFieldValue(page, "seo_title")}
                    onChange={(e) => handleChange(page.id, "seo_title", e.target.value)}
                    placeholder="Enter page title..."
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {getFieldValue(page, "seo_title").length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`desc-${page.id}`}>Meta Description</Label>
                  <Textarea
                    id={`desc-${page.id}`}
                    value={getFieldValue(page, "seo_description")}
                    onChange={(e) => handleChange(page.id, "seo_description", e.target.value)}
                    placeholder="Enter meta description..."
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {getFieldValue(page, "seo_description").length}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`keywords-${page.id}`}>Keywords</Label>
                  <Input
                    id={`keywords-${page.id}`}
                    value={getFieldValue(page, "seo_keywords")}
                    onChange={(e) => handleChange(page.id, "seo_keywords", e.target.value)}
                    placeholder="keyword1, keyword2, keyword3..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated keywords
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`prompt-${page.id}`}>Image Prompt (optional)</Label>
                  <Textarea
                    id={`prompt-${page.id}`}
                    value={getFieldValue(page, "image_prompt")}
                    onChange={(e) => handleChange(page.id, "image_prompt", e.target.value)}
                    placeholder="Describe the visual style, elements, mood for the OG image... (e.g., 'Dramatic studio scene with mixing console, red neon lights, audio waveforms')"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom prompt for AI image generation. Leave empty to use default style based on title.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`og-${page.id}`}>OG Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`og-${page.id}`}
                      value={getFieldValue(page, "og_image")}
                      onChange={(e) => handleChange(page.id, "og_image", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      type="url"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateOGImage(page)}
                      disabled={generatingId === page.id}
                      className="shrink-0"
                    >
                      {generatingId === page.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generate uses your custom prompt above, or defaults to page title/description style
                  </p>
                  {getFieldValue(page, "og_image") && (
                    <img 
                      src={getFieldValue(page, "og_image")} 
                      alt="OG Preview" 
                      className="mt-2 rounded-lg border border-border max-h-32 object-cover"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a 
                    href={page.path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Preview page <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button
                    onClick={() => handleSave(page)}
                    disabled={!hasChanges(page.id) || savingId === page.id}
                    size="sm"
                    className="gap-2"
                  >
                    {savingId === page.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default PageSeoManager;
