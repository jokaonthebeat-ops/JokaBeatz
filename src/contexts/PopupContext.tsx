import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PopupContextType {
  isOpen: boolean;
  openPopup: () => void;
  closePopup: () => void;
  markAsConverted: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

const STORAGE_KEY = "freeBeatsPopupDismissed";
const CONVERTED_KEY = "freeBeatsPopupConverted";
const DISMISS_DAYS = 7;

const POPUP_CONFIG = {
  delayMs: 30000,        // Show after 30 seconds
  scrollPercent: 50,     // Or after 50% scroll
  exitIntent: true,      // Or on exit intent
};

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const location = useLocation();

  const shouldShowPopup = useCallback(() => {
    // Don't show on free-beats page
    if (location.pathname === "/free-beats") return false;
    
    // Check if user already converted
    if (localStorage.getItem(CONVERTED_KEY)) return false;
    
    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff < DISMISS_DAYS) return false;
    }
    
    return true;
  }, [location.pathname]);

  const openPopup = useCallback(() => {
    if (shouldShowPopup() && !hasTriggered) {
      setIsOpen(true);
      setHasTriggered(true);
    }
  }, [shouldShowPopup, hasTriggered]);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }, []);

  const markAsConverted = useCallback(() => {
    localStorage.setItem(CONVERTED_KEY, "true");
    setIsOpen(false);
  }, []);

  // Reset trigger when navigating away from free-beats
  useEffect(() => {
    if (location.pathname === "/free-beats") {
      setHasTriggered(true); // Prevent triggering on this page
    }
  }, [location.pathname]);

  // Time delay trigger
  useEffect(() => {
    if (!shouldShowPopup() || hasTriggered) return;

    const timer = setTimeout(() => {
      openPopup();
    }, POPUP_CONFIG.delayMs);

    return () => clearTimeout(timer);
  }, [shouldShowPopup, hasTriggered, openPopup]);

  // Scroll trigger
  useEffect(() => {
    if (!shouldShowPopup() || hasTriggered) return;

    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= POPUP_CONFIG.scrollPercent) {
        openPopup();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldShowPopup, hasTriggered, openPopup]);

  // Exit intent trigger (desktop only)
  useEffect(() => {
    if (!shouldShowPopup() || hasTriggered || !POPUP_CONFIG.exitIntent) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        openPopup();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [shouldShowPopup, hasTriggered, openPopup]);

  return (
    <PopupContext.Provider value={{ isOpen, openPopup, closePopup, markAsConverted }}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
};
