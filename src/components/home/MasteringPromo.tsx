import { Link } from "react-router-dom";
import { Sparkles, Zap, Music2, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  "Free preview before you pay",
  "AI mastering from $14.99",
  "Streaming-optimized loudness",
  "Multiple genre presets",
  "High-quality WAV download",
  "Professional mixing available",
];

export const MasteringPromo = () => {
  return (
    <section className="py-14 md:py-20 bg-card relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_50%,_hsl(0_84%_50%_/_0.12),_transparent)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary-bright text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              <Zap size={13} />
              AI-POWERED
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 leading-tight">
              Mixing &amp; Mastering <br className="hidden sm:block" />
              <span className="text-primary">Done Right</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mb-6 leading-relaxed">
              Get your track sounding professional in minutes with AI mastering — or book a full mix. Hear the difference before you pay.
            </p>

            <ul className="space-y-2.5 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle size={16} className="text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-5 red-glow red-glow-hover"
            >
              <Link to="/ai-mastering">
                Try AI Mastering Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Right: Visual card */}
          <div className="relative">
            <div className="bg-secondary border border-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
              {/* Glow inside card */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl animate-pulse-glow" />
                  <Sparkles size={24} className="text-primary relative z-10" />
                </div>
                <div>
                  <p className="text-foreground font-black text-base">AI Mastering</p>
                  <p className="text-muted-foreground text-xs">From $14.99 per track</p>
                </div>
              </div>

              {/* Fake waveform bars */}
              <div className="flex items-end gap-1 h-16 mb-6">
                {[4,7,5,9,6,11,8,13,10,8,12,7,9,5,8,10,6,9,7,5,8,11,6,8].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary/30 rounded-sm animate-pulse"
                    style={{
                      height: `${(h / 13) * 100}%`,
                      animationDelay: `${i * 0.05}s`,
                      animationDuration: "1.5s",
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <Music2 size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-foreground font-bold text-sm">Professional Mixing</p>
                  <p className="text-muted-foreground text-xs">Full mix service available</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  ✓ Preview free &nbsp;·&nbsp; ✓ Pay only if you love it
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
