import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Calendar, Tv, Users, Zap, Award } from "lucide-react";
import jokaBeatzLogo from "@/assets/joka-beatz-logo.png";
import heroVideo from "@/assets/hero-video.mp4";

const credibilityItems = [
  { icon: Tv, text: "TV Placements" },
  { icon: Users, text: "Artist Collaborations" },
  { icon: Zap, text: "Fast Turnaround" },
  { icon: Award, text: "Industry-Quality" },
];

export const HeroSection = () => {
  // Defer the heavy background video until after first paint so it doesn't
  // compete with the hero logo/headline for bandwidth (improves LCP).
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const start = () => setShowVideo(true);
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    if (idle) {
      const id = idle(start);
      return () => {
        const cancel = (window as Window & { cancelIdleCallback?: (id: number) => void })
          .cancelIdleCallback;
        cancel?.(id);
      };
    }
    const timer = window.setTimeout(start, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const scrollToPlayer = () => {
    const playerSection = document.getElementById("beatstars-player");
    if (playerSection) {
      playerSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        {showVideo && (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
        )}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
        {/* Red glow accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_84%_50%_/_0.15)_0%,_transparent_60%)]" />
      </div>

      {/* Animated particles overlay - hidden on mobile for performance */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary/30 rounded-full animate-float-particle-delayed" />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary/50 rounded-full animate-float-particle-slow" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float-particle-delayed" />
        <div className="absolute bottom-1/3 right-1/2 w-1.5 h-1.5 bg-primary/40 rounded-full animate-float-particle" />
      </div>

      {/* Animated corner accents - hidden on mobile */}
      <div className="hidden md:block">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-primary/20 to-transparent blur-3xl animate-pulse-glow-delayed" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20 text-center">
        {/* Logo */}
        <div className="relative inline-block mb-6 md:mb-8">
          <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse-glow hidden md:block" />
          <img 
            src={jokaBeatzLogo} 
            alt="Joka Beatz - Professional Beat Producer" 
            className="relative h-24 sm:h-32 md:h-40 lg:h-48 w-auto mx-auto drop-shadow-2xl"
            fetchPriority="high"
            decoding="async"
            width="192"
            height="192"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-4 md:mb-6 leading-tight">
          Industry-Ready Beats &<br />
          <span className="text-primary">Pro Studio Services</span>
        </h1>

        <p className="text-base md:text-xl text-muted-foreground mb-3 md:mb-4 max-w-2xl mx-auto">
          Hip Hop • R&B • Trap • AfroBeat • Pop
        </p>

        <p className="text-sm md:text-lg text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
          Built for artists who want professional sound and real results.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-10 md:mb-16">
          <Button
            onClick={scrollToPlayer}
            size="lg"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 red-glow red-glow-hover min-h-[56px]"
          >
            <Play className="mr-2" size={20} />
            Play Beats
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-foreground text-foreground hover:bg-foreground hover:text-background font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 min-h-[56px]"
          >
            <Link to="/contact">
              <Calendar className="mr-2" size={20} />
              Book a Session
            </Link>
          </Button>
        </div>

        {/* Credibility Bar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-4 md:gap-6 lg:gap-12">
          {credibilityItems.map((item, index) => (
            <div key={index} className="flex items-center justify-center gap-2 text-muted-foreground">
              <item.icon size={18} className="text-primary shrink-0 md:w-5 md:h-5" />
              <span className="text-xs md:text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
