import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import FeatureCard from "@/components/free-beats/FeatureCard";
import EbookMockup from "@/components/free-guide/EbookMockup";
import { BookOpen, Target, XCircle, DollarSign, ExternalLink, Users, Star } from "lucide-react";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { getPageShareContent } from "@/lib/shareContent";

const features = [
  {
    icon: BookOpen,
    title: "How Supervisors Find Music",
    description: "Learn the exact process music supervisors use to discover and select tracks for placements.",
  },
  {
    icon: Target,
    title: "Anatomy of a Winning Pitch",
    description: "Master the art of pitching your music with proven templates and strategies.",
  },
  {
    icon: XCircle,
    title: "Common Mistakes to Avoid",
    description: "Discover the rejection triggers that kill most submissions before they're heard.",
  },
  {
    icon: DollarSign,
    title: "How to Price Your Licenses",
    description: "Understand licensing tiers and learn to negotiate deals that reflect your worth.",
  },
];

const FreeGuide = () => {
  const handleGetGuide = () => {
    window.open("https://syncstarz.com/free-guide", "_blank", "noopener,noreferrer");
  };

  const guideShareContent = getPageShareContent("free-guide");

  return (
    <Layout path="/free-guide">
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Free Guide", url: "https://jokabeatz.com/free-guide" },
        ]} 
      />
      
      <section className="relative min-h-screen pt-20 md:pt-24 pb-12 md:pb-16 overflow-hidden">
        {/* Background effects - reduced on mobile */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/20 to-background" />
        <div className="absolute inset-0 opacity-30 hidden md:block">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-glow delay-1000" />
        </div>
        
        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Marketing Content */}
            <div className="space-y-6 md:space-y-8 order-2 lg:order-1">
              {/* Social proof badge */}
              <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-secondary/50 backdrop-blur-sm rounded-full border border-border/50">
                <Users size={16} className="text-primary shrink-0" />
                <span className="text-xs md:text-sm text-muted-foreground">
                  Join <span className="text-primary font-bold">10,000+</span> artists already learning
                </span>
              </div>

              {/* Headlines */}
              <div className="space-y-3 md:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-tight">
                  How Music Placements{" "}
                  <span className="text-primary">Really Work</span> in 2026
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                  Discover the insider secrets that music supervisors don't tell you. 
                  Get the complete playbook for landing your tracks in TV, film, ads, and games.
                </p>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {features.map((feature, index) => (
                  <FeatureCard
                    key={index}
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                ))}
              </div>

              {/* Testimonial */}
              <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground italic text-xs md:text-sm">
                  "This guide changed how I approach sync licensing. Landed my first TV placement within 3 months!"
                </p>
                <p className="text-xs text-muted-foreground mt-2">— Independent Artist</p>
              </div>
            </div>

            {/* Right Column - Visual + CTA */}
            <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
              {/* Ebook mockup */}
              <EbookMockup />

              {/* CTA Card */}
              <div className="bg-card/50 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-border/50 space-y-4 md:space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">
                    Get Your Free Copy
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Instant download. No credit card required.
                  </p>
                </div>

                <Button 
                  onClick={handleGetGuide}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg py-5 md:py-6 red-glow min-h-[56px]"
                >
                  Download Free Ebook
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By clicking, you'll be redirected to SyncStarz to complete your download.
                </p>

                <ShareButtons 
                  title="Free Guide: How Music Placements Really Work | Joka Beatz" 
                  path="/free-guide"
                  caption={guideShareContent.caption}
                  hashtags={guideShareContent.hashtags}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FreeGuide;
