import { useState, useEffect, useCallback } from "react";

export interface CookiePreferences {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_KEY = "joka-beatz-cookie-consent";
const PREFERENCES_KEY = "joka-beatz-cookie-preferences";

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export const useCookieConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);

  // Load consent state on mount
  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    const savedPrefs = localStorage.getItem(PREFERENCES_KEY);
    
    if (consent === "true") {
      setHasConsented(true);
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch {
          setPreferences(defaultPreferences);
        }
      }
      setShowBanner(false);
    } else if (consent === "false") {
      setHasConsented(false);
      setShowBanner(false);
    } else {
      // No decision made yet
      setHasConsented(null);
      setShowBanner(true);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem(CONSENT_KEY, "true");
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setHasConsented(true);
    setShowBanner(false);
  }, []);

  const rejectNonEssential = useCallback(() => {
    const essentialOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem(CONSENT_KEY, "false");
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(essentialOnly));
    setPreferences(essentialOnly);
    setHasConsented(false);
    setShowBanner(false);
  }, []);

  const savePreferences = useCallback((newPrefs: CookiePreferences) => {
    const prefs = { ...newPrefs, necessary: true }; // Always keep necessary
    const hasAnyOptional = prefs.analytics || prefs.marketing;
    localStorage.setItem(CONSENT_KEY, hasAnyOptional ? "true" : "false");
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setHasConsented(hasAnyOptional);
    setShowBanner(false);
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(PREFERENCES_KEY);
    setHasConsented(null);
    setPreferences(defaultPreferences);
    setShowBanner(true);
  }, []);

  return {
    hasConsented,
    preferences,
    showBanner,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    resetConsent,
    setShowBanner,
  };
};
