import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadGrid } from "./ImageUploadGrid";
import { AudioUpload } from "./AudioUpload";
import { VideoStyleCard } from "./VideoStyleCard";
import { MusicVideoSettings, MusicVideoUpgrade } from "@/hooks/useMusicVideoSettings";
import { Loader2, Sparkles, Video, Film, Monitor, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderFormProps {
  settings: MusicVideoSettings;
  onSubmit: (data: OrderFormData) => void;
  isSubmitting: boolean;
}

export interface OrderFormData {
  customerName: string;
  customerEmail: string;
  videoStyle: "reels" | "full";
  videoQuality: "720p" | "1080p";
  selectedUpgrades: string[];
  images: File[];
  song: File;
  visionDescription: string;
  totalPrice: number;
  basePrice: number;
}

export const OrderForm = ({ settings, onSubmit, isSubmitting }: OrderFormProps) => {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [videoStyle, setVideoStyle] = useState<"reels" | "full">("reels");
  const [videoQuality, setVideoQuality] = useState<"720p" | "1080p">("720p");
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [song, setSong] = useState<File | null>(null);
  const [visionDescription, setVisionDescription] = useState("");

  const basePrice = videoStyle === "reels" ? settings.reels_price : settings.full_video_price;
  const qualityPrice = videoQuality === "1080p" ? settings.upgrade_1080p_price : 0;
  const upgradesPrice = selectedUpgrades.reduce((sum, id) => {
    const upgrade = settings.available_upgrades.find((u) => u.id === id);
    return sum + (upgrade?.price || 0);
  }, 0);
  const totalPrice = basePrice + qualityPrice + upgradesPrice;

  const toggleUpgrade = (id: string) => {
    setSelectedUpgrades((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!song) return;

    onSubmit({
      customerName,
      customerEmail,
      videoStyle,
      videoQuality,
      selectedUpgrades,
      images,
      song,
      visionDescription,
      totalPrice,
      basePrice,
    });
  };

  const isValid =
    customerName.trim() &&
    customerEmail.trim() &&
    images.length >= 1 &&
    song &&
    visionDescription.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Video Style Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Choose Your Style
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <VideoStyleCard
            title="Reels Style"
            description="Perfect for TikTok, Instagram Reels, YouTube Shorts"
            price={settings.reels_price}
            features={[
              "9:16 vertical format",
              "15-60 seconds duration",
              "Fast-paced edits",
              "Trending transitions",
              "Social media optimized",
            ]}
            isSelected={videoStyle === "reels"}
            onSelect={() => setVideoStyle("reels")}
            demoUrl={settings.demo_reels_url}
          />
          <VideoStyleCard
            title="Full Music Video"
            description="Cinematic quality for YouTube & official releases"
            price={settings.full_video_price}
            features={[
              "16:9 widescreen format",
              "Full song length",
              "Cinematic transitions",
              "Color grading included",
              "YouTube optimized",
            ]}
            isSelected={videoStyle === "full"}
            onSelect={() => setVideoStyle("full")}
            demoUrl={settings.demo_full_video_url}
          />
        </div>
      </div>

      {/* Quality Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          Video Quality
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setVideoQuality("720p")}
            className={cn(
              "cursor-pointer rounded-xl border-2 p-4 text-center transition-all",
              videoQuality === "720p"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <MonitorSmartphone className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-bold">720p HD</p>
            <p className="text-sm text-muted-foreground">Included</p>
          </div>
          <div
            onClick={() => setVideoQuality("1080p")}
            className={cn(
              "cursor-pointer rounded-xl border-2 p-4 text-center transition-all",
              videoQuality === "1080p"
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <Monitor className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="font-bold">1080p Full HD</p>
            <p className="text-sm text-primary">+${settings.upgrade_1080p_price}</p>
          </div>
        </div>
      </div>

      {/* Upgrades */}
      {settings.available_upgrades.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Add-Ons
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.available_upgrades.map((upgrade) => (
              <label
                key={upgrade.id}
                htmlFor={`upgrade-${upgrade.id}`}
                className={cn(
                  "cursor-pointer rounded-xl border-2 p-4 transition-all select-none",
                  selectedUpgrades.includes(upgrade.id)
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`upgrade-${upgrade.id}`}
                    checked={selectedUpgrades.includes(upgrade.id)}
                    onCheckedChange={() => toggleUpgrade(upgrade.id)}
                    className="mt-1"
                  />
                  <div className="pointer-events-none">
                    <p className="font-bold">{upgrade.name}</p>
                    <p className="text-sm text-primary">+${upgrade.price}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Film className="w-5 h-5 text-primary" />
          Your Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">
          Artist Photos <span className="text-primary">*</span>
        </h3>
        <p className="text-muted-foreground text-sm">
          Upload 1-5 photos of the artist to feature in the video
        </p>
        <ImageUploadGrid images={images} onImagesChange={setImages} maxImages={5} />
      </div>

      {/* Song Upload */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">
          Your Song <span className="text-primary">*</span>
        </h3>
        <p className="text-muted-foreground text-sm">
          Upload the track you want us to create a video for
        </p>
        <AudioUpload file={song} onFileChange={setSong} />
      </div>

      {/* Vision Description */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-foreground">
          Your Vision <span className="text-primary">*</span>
        </h3>
        <p className="text-muted-foreground text-sm">
          Describe how you want the video to look (style, mood, specific scenes, effects, etc.)
        </p>
        <Textarea
          value={visionDescription}
          onChange={(e) => setVisionDescription(e.target.value)}
          placeholder="I want a dark, moody vibe with slow motion effects and cinematic color grading. Feature the artist against urban backdrops with neon lighting..."
          rows={5}
          required
        />
      </div>

      {/* Price Summary & Submit */}
      <div className="bg-card border border-border rounded-2xl p-6 sticky bottom-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Price</p>
            <p className="text-4xl font-black text-primary">${totalPrice.toFixed(2)}</p>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <p>
                {videoStyle === "reels" ? "Reels" : "Full Video"}: ${basePrice}
              </p>
              {qualityPrice > 0 && <p>1080p Quality: +${qualityPrice}</p>}
              {upgradesPrice > 0 && <p>Add-ons: +${upgradesPrice.toFixed(2)}</p>}
            </div>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={!isValid || isSubmitting}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 red-glow red-glow-hover min-h-[56px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Order Now - ${totalPrice.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
