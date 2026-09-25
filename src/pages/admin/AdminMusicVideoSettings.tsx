import { useState, useEffect } from "react";
import { useMusicVideoSettings, useUpdateMusicVideoSettings, MusicVideoUpgrade } from "@/hooks/useMusicVideoSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, Save, DollarSign, Video, Sparkles, Type } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoUpload } from "@/components/admin/VideoUpload";

const AdminMusicVideoSettings = () => {
  const { data: settings, isLoading } = useMusicVideoSettings();
  const updateSettings = useUpdateMusicVideoSettings();

  const [reelsPrice, setReelsPrice] = useState("");
  const [fullVideoPrice, setFullVideoPrice] = useState("");
  const [upgrade720pPrice, setUpgrade720pPrice] = useState("");
  const [upgrade1080pPrice, setUpgrade1080pPrice] = useState("");
  const [demoReelsUrl, setDemoReelsUrl] = useState("");
  const [demoFullVideoUrl, setDemoFullVideoUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [upgrades, setUpgrades] = useState<MusicVideoUpgrade[]>([]);

  useEffect(() => {
    if (settings) {
      setReelsPrice(settings.reels_price.toString());
      setFullVideoPrice(settings.full_video_price.toString());
      setUpgrade720pPrice(settings.upgrade_720p_price.toString());
      setUpgrade1080pPrice(settings.upgrade_1080p_price.toString());
      setDemoReelsUrl(settings.demo_reels_url || "");
      setDemoFullVideoUrl(settings.demo_full_video_url || "");
      setHeadline(settings.headline);
      setSubheadline(settings.subheadline);
      setUpgrades(settings.available_upgrades || []);
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({
      reels_price: parseFloat(reelsPrice) || 0,
      full_video_price: parseFloat(fullVideoPrice) || 0,
      upgrade_720p_price: parseFloat(upgrade720pPrice) || 0,
      upgrade_1080p_price: parseFloat(upgrade1080pPrice) || 0,
      demo_reels_url: demoReelsUrl || null,
      demo_full_video_url: demoFullVideoUrl || null,
      headline,
      subheadline,
      available_upgrades: upgrades,
    });
  };

  const addUpgrade = () => {
    setUpgrades([...upgrades, { id: `upgrade-${Date.now()}`, name: "", price: 0 }]);
  };

  const updateUpgrade = (index: number, field: keyof MusicVideoUpgrade, value: string | number) => {
    const updated = [...upgrades];
    updated[index] = { ...updated[index], [field]: value };
    setUpgrades(updated);
  };

  const removeUpgrade = (index: number) => {
    setUpgrades(upgrades.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Music Video Settings</h1>
          <p className="text-muted-foreground">Configure pricing, demos, and page content</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pricing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </CardTitle>
            <CardDescription>Set base prices and quality upgrades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reels Style Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={reelsPrice}
                    onChange={(e) => setReelsPrice(e.target.value)}
                    className="pl-7"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Full Video Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={fullVideoPrice}
                    onChange={(e) => setFullVideoPrice(e.target.value)}
                    className="pl-7"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>720p Upgrade</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={upgrade720pPrice}
                    onChange={(e) => setUpgrade720pPrice(e.target.value)}
                    className="pl-7"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>1080p Upgrade</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={upgrade1080pPrice}
                    onChange={(e) => setUpgrade1080pPrice(e.target.value)}
                    className="pl-7"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Videos Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Demo Videos
            </CardTitle>
            <CardDescription>Upload or link demo videos for style previews</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Reels Demo</Label>
              <VideoUpload
                value={demoReelsUrl || null}
                onChange={(url) => setDemoReelsUrl(url || "")}
                label="Reels demo video"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Full Video Demo</Label>
              <VideoUpload
                value={demoFullVideoUrl || null}
                onChange={(url) => setDemoFullVideoUrl(url || "")}
                label="Full video demo"
              />
            </div>
          </CardContent>
        </Card>

        {/* Page Content Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Page Content
            </CardTitle>
            <CardDescription>Headlines and text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Custom Music Videos"
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Input
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                placeholder="Bring your song to life..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Add-Ons Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Add-Ons
            </CardTitle>
            <CardDescription>Optional upgrades customers can purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upgrades.map((upgrade, index) => (
              <div key={upgrade.id} className="flex items-center gap-2">
                <Input
                  value={upgrade.name}
                  onChange={(e) => updateUpgrade(index, "name", e.target.value)}
                  placeholder="Upgrade name"
                  className="flex-1"
                />
                <div className="relative w-24">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={upgrade.price}
                    onChange={(e) => updateUpgrade(index, "price", parseFloat(e.target.value) || 0)}
                    className="pl-7"
                    step="0.01"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUpgrade(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addUpgrade} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMusicVideoSettings;
