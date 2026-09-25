import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useBlogSettings, useUpdateBlogSettings } from "@/hooks/useBlogSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const AdminBlogSettings = () => {
  const { data: settings, isLoading } = useBlogSettings();
  const updateSettings = useUpdateBlogSettings();

  const [formData, setFormData] = useState<{
    auto_generate_enabled: boolean;
    generation_frequency: string;
    default_author: string;
    content_topics: Record<string, number>;
  }>({
    auto_generate_enabled: false,
    generation_frequency: "weekly",
    default_author: "Joka Beatz",
    content_topics: {
      "music-business": 40,
      "industry-news": 30,
      "ai-music": 30,
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        auto_generate_enabled: settings.auto_generate_enabled,
        generation_frequency: settings.generation_frequency,
        default_author: settings.default_author,
        content_topics: settings.content_topics as Record<string, number>,
      });
    }
  }, [settings]);

  const handleTopicChange = (topic: string, value: number) => {
    const total = Object.values(formData.content_topics).reduce((sum, v) => sum + v, 0) - formData.content_topics[topic] + value;
    
    if (total <= 100) {
      setFormData((prev) => ({
        ...prev,
        content_topics: { ...prev.content_topics, [topic]: value },
      }));
    }
  };

  const handleSave = async () => {
    if (!settings?.id) return;
    await updateSettings.mutateAsync({
      id: settings.id,
      ...formData,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Blog Settings</h1>
        <p className="text-muted-foreground">Configure auto-generation and defaults</p>
      </div>

      {/* Auto Generation Toggle */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Auto-Generate Posts</h3>
            <p className="text-sm text-muted-foreground">
              Automatically generate blog posts on a schedule
            </p>
          </div>
          <Switch
            checked={formData.auto_generate_enabled}
            onCheckedChange={(checked) => 
              setFormData((prev) => ({ ...prev, auto_generate_enabled: checked }))
            }
          />
        </div>

        {settings?.last_generated_at && (
          <p className="text-xs text-muted-foreground mt-4">
            Last generated: {format(new Date(settings.last_generated_at), "PPpp")}
          </p>
        )}
      </div>

      {/* Generation Frequency */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <Label className="mb-2 block">Generation Frequency</Label>
        <Select
          value={formData.generation_frequency}
          onValueChange={(value) => 
            setFormData((prev) => ({ ...prev, generation_frequency: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="twice-weekly">Twice Weekly</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Default Author */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <Label htmlFor="author" className="mb-2 block">Default Author</Label>
        <Input
          id="author"
          value={formData.default_author}
          onChange={(e) => 
            setFormData((prev) => ({ ...prev, default_author: e.target.value }))
          }
        />
      </div>

      {/* Topic Distribution */}
      <div className="bg-card p-6 rounded-lg border border-border space-y-6">
        <div>
          <h3 className="font-semibold mb-1">Topic Distribution</h3>
          <p className="text-sm text-muted-foreground">
            How often each category should be generated (total: {Object.values(formData.content_topics).reduce((a, b) => a + b, 0)}%)
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Making Money in Music</span>
              <span>{formData.content_topics["music-business"]}%</span>
            </div>
            <Slider
              value={[formData.content_topics["music-business"]]}
              onValueChange={([value]) => handleTopicChange("music-business", value)}
              max={100}
              step={5}
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Industry News</span>
              <span>{formData.content_topics["industry-news"]}%</span>
            </div>
            <Slider
              value={[formData.content_topics["industry-news"]]}
              onValueChange={([value]) => handleTopicChange("industry-news", value)}
              max={100}
              step={5}
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>AI in Music</span>
              <span>{formData.content_topics["ai-music"]}%</span>
            </div>
            <Slider
              value={[formData.content_topics["ai-music"]]}
              onValueChange={([value]) => handleTopicChange("ai-music", value)}
              max={100}
              step={5}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
};

export default AdminBlogSettings;
