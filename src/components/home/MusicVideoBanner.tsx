import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Sparkles, ArrowRight } from "lucide-react";

export const MusicVideoBanner = () => {
  return (
    <section className="py-12 md:py-16 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 animate-pulse-glow" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-primary/30 rounded-full animate-float-particle-delayed" />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary/50 rounded-full animate-float-particle-slow" />
      </div>

      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-primary/15 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur-sm border border-primary/30 rounded-2xl p-6 md:p-10 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Icon Section */}
            <div className="shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse-glow" />
                <div className="relative p-5 md:p-6 bg-primary/10 rounded-full border border-primary/30">
                  <Video size={40} className="text-primary md:w-12 md:h-12" />
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Sparkles size={16} className="text-primary" />
                <span className="text-xs md:text-sm font-semibold text-primary uppercase tracking-wider">
                  New Service
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-foreground mb-2 md:mb-3">
                Custom Music Videos
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-0 max-w-lg">
                Bring your music to life with stunning AI-powered visuals. Upload your track and photos — we'll create a professional music video.
              </p>
            </div>

            {/* CTA Section */}
            <div className="shrink-0">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 red-glow red-glow-hover min-h-[48px] group"
              >
                <Link to="/music-videos">
                  Get Started
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
