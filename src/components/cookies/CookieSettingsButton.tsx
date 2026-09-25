import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export const CookieSettingsButton = () => {
  const { resetConsent } = useCookieConsent();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={resetConsent}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <Cookie className="h-4 w-4" />
      Cookie Settings
    </Button>
  );
};
