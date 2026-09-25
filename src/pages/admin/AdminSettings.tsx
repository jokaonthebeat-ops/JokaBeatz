import { useState, useEffect } from "react";
import { useSiteSettings, useUpdateSiteSettings, SiteSettings } from "@/hooks/useSiteSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Globe, Share2, Search, Sparkles, Image, Youtube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SenderDomainManager from "@/components/admin/SenderDomainManager";
import PageSeoManager from "@/components/admin/PageSeoManager";
import { PartnerLinksManager } from "@/components/admin/PartnerLinksManager";
import { BeatLicenseDefaults } from "@/components/admin/BeatLicenseDefaults";
const AdminSettings = () => {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const [isGeneratingOG, setIsGeneratingOG] = useState(false);
  
  const [formData, setFormData] = useState<SiteSettings>({
    site_url: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    og_image: "",
    twitter_handle: "",
    theme_color: "",
    instagram_url: "",
    youtube_url: "",
    twitter_url: "",
    beatstars_url: "",
    youtube_video_id: "",
    sender_email: "",
    sender_name: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (key: keyof SiteSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: "Settings saved",
        description: "Your SEO and social settings have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site Settings</h1>
        <p className="text-muted-foreground">Manage SEO and social media settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Site URL
            </CardTitle>
            <CardDescription>
              Your custom domain used for sharing and SEO links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="site_url">Custom Domain</Label>
              <Input
                id="site_url"
                value={formData.site_url}
                onChange={(e) => handleChange("site_url", e.target.value)}
                placeholder="https://yourdomain.com"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Used for share links and canonical URLs (e.g., https://jokabeatz.com)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Partner Links */}
        <PartnerLinksManager />

        {/* Sender Domains */}
        <SenderDomainManager />

        {/* Page-Specific SEO */}
        <PageSeoManager />

        {/* Global SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Global SEO Defaults
            </CardTitle>
            <CardDescription>
              Default SEO settings used when page-specific settings are not defined
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_title">Default Site Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title}
                onChange={(e) => handleChange("seo_title", e.target.value)}
                placeholder="Joka Beatz - Industry-Ready Beats"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground">
                {formData.seo_title.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">Default Meta Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description}
                onChange={(e) => handleChange("seo_description", e.target.value)}
                placeholder="Professional beats and music production services..."
                maxLength={160}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.seo_description.length}/160 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords">Default Keywords</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords}
                onChange={(e) => handleChange("seo_keywords", e.target.value)}
                placeholder="beats, instrumentals, music production"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated keywords (fallback for pages without specific keywords)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Open Graph / Social */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Open Graph Settings
            </CardTitle>
            <CardDescription>
              Control how your site appears when shared on social media
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Label>OG Image</Label>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Preview */}
                <div className="w-full md:w-48 h-28 bg-secondary rounded-lg overflow-hidden flex items-center justify-center border border-border">
                  {formData.og_image ? (
                    <img 
                      src={formData.og_image} 
                      alt="OG Preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                      <Image className="h-6 w-6" />
                      <span>No image</span>
                    </div>
                  )}
                </div>
                
                {/* Generate Button */}
                <div className="flex-1 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isGeneratingOG || !formData.seo_title}
                    onClick={async () => {
                      setIsGeneratingOG(true);
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) {
                          throw new Error("Not authenticated");
                        }
                        
                        const response = await fetch(
                          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-og-image`,
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({
                              title: formData.seo_title || "Joka Beatz",
                              tagline: formData.seo_description,
                            }),
                          }
                        );
                        
                        const data = await response.json();
                        
                        if (!response.ok) {
                          throw new Error(data.error || "Failed to generate image");
                        }
                        
                        handleChange("og_image", data.url);
                        toast({
                          title: "OG Image Generated",
                          description: "Your new social preview image is ready!",
                        });
                      } catch (error) {
                        console.error("Error generating OG image:", error);
                        toast({
                          title: "Generation Failed",
                          description: error instanceof Error ? error.message : "Please try again.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsGeneratingOG(false);
                      }
                    }}
                    className="gap-2"
                  >
                    {isGeneratingOG ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate with AI
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {!formData.seo_title 
                      ? "Enter a site title first to generate" 
                      : "Uses AI to create a 1200x630px social preview image"}
                  </p>
                </div>
              </div>
              
              {/* Manual URL Input */}
              <div className="space-y-2">
                <Label htmlFor="og_image">Or enter URL manually</Label>
                <Input
                  id="og_image"
                  value={formData.og_image}
                  onChange={(e) => handleChange("og_image", e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                  type="url"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter_handle">Twitter Handle</Label>
                <Input
                  id="twitter_handle"
                  value={formData.twitter_handle}
                  onChange={(e) => handleChange("twitter_handle", e.target.value)}
                  placeholder="@JokaBeatz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme_color">Theme Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="theme_color"
                    value={formData.theme_color}
                    onChange={(e) => handleChange("theme_color", e.target.value)}
                    placeholder="#DC2626"
                  />
                  <div
                    className="w-10 h-10 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: formData.theme_color || "#DC2626" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5" />
              Content Settings
            </CardTitle>
            <CardDescription>
              Manage featured content displayed on the site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="youtube_video_id">Featured YouTube Video ID</Label>
              <Input
                id="youtube_video_id"
                value={formData.youtube_video_id}
                onChange={(e) => handleChange("youtube_video_id", e.target.value)}
                placeholder="dQw4w9WgXcQ"
              />
              <p className="text-xs text-muted-foreground">
                Enter just the video ID from the YouTube URL (e.g., for https://youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>)
              </p>
            </div>
            
            {/* Video Preview */}
            {formData.youtube_video_id && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="aspect-video max-w-md bg-secondary rounded-lg overflow-hidden border border-border">
                  <img 
                    src={`https://img.youtube.com/vi/${formData.youtube_video_id}/maxresdefault.jpg`}
                    alt="Video thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://img.youtube.com/vi/${formData.youtube_video_id}/hqdefault.jpg`;
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Social Media Links
            </CardTitle>
            <CardDescription>
              Your social media profile URLs (used in footer and contact page)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => handleChange("instagram_url", e.target.value)}
                  placeholder="https://instagram.com/jokabeatz"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url">YouTube URL</Label>
                <Input
                  id="youtube_url"
                  value={formData.youtube_url}
                  onChange={(e) => handleChange("youtube_url", e.target.value)}
                  placeholder="https://youtube.com/@jokabeatz"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_url">Twitter URL</Label>
                <Input
                  id="twitter_url"
                  value={formData.twitter_url}
                  onChange={(e) => handleChange("twitter_url", e.target.value)}
                  placeholder="https://twitter.com/jokabeatz"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beatstars_url">BeatStars URL</Label>
                <Input
                  id="beatstars_url"
                  value={formData.beatstars_url}
                  onChange={(e) => handleChange("beatstars_url", e.target.value)}
                  placeholder="https://beatstars.com/jokabeatz"
                  type="url"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending} className="gap-2">
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </Button>
        </div>
      </form>
      <BeatLicenseDefaults />
    </div>
  );
};

export default AdminSettings;
