import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cookie, Settings, X } from "lucide-react";
import { useCookieConsent, CookiePreferences } from "@/hooks/useCookieConsent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const CookieConsentBanner = () => {
  const {
    showBanner,
    preferences,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    setShowBanner,
  } = useCookieConsent();

  const [showSettings, setShowSettings] = useState(false);
  const [tempPrefs, setTempPrefs] = useState<CookiePreferences>(preferences);

  if (!showBanner) return null;

  const handleSaveSettings = () => {
    savePreferences(tempPrefs);
    setShowSettings(false);
  };

  return (
    <>
      {/* Main Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-300">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card border border-border rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">We use cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to improve your experience, analyze site traffic, and personalize content. 
                    Read our{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    for more information.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempPrefs(preferences);
                    setShowSettings(true);
                  }}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Customize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rejectNonEssential}
                >
                  Reject All
                </Button>
                <Button
                  size="sm"
                  onClick={acceptAll}
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. Some cookies are necessary for the site to function.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-foreground font-medium">Necessary</Label>
                <p className="text-xs text-muted-foreground">
                  Required for the site to function (login, cart, etc.)
                </p>
              </div>
              <Switch checked disabled className="data-[state=checked]:bg-primary" />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-foreground font-medium">Analytics</Label>
                <p className="text-xs text-muted-foreground">
                  Help us understand how visitors use our site
                </p>
              </div>
              <Switch
                checked={tempPrefs.analytics}
                onCheckedChange={(checked) =>
                  setTempPrefs((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-foreground font-medium">Marketing</Label>
                <p className="text-xs text-muted-foreground">
                  Used for personalized ads and promotions
                </p>
              </div>
              <Switch
                checked={tempPrefs.marketing}
                onCheckedChange={(checked) =>
                  setTempPrefs((prev) => ({ ...prev, marketing: checked }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveSettings}>
              Save Preferences
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Learn more in our{" "}
            <Link
              to="/privacy-policy"
              className="text-primary hover:underline"
              onClick={() => setShowSettings(false)}
            >
              Privacy Policy
            </Link>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
