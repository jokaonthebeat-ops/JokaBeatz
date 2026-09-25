import { Button } from "@/components/ui/button";
import { Youtube, Music } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const YouTubeSection = () => {
  const { data: settings } = useSiteSettings();
  const videoId = settings?.youtube_video_id || "1CIlH-Dwe_g";
  const youtubeUrl = settings?.youtube_url || "https://youtube.com/@jokabeatz";

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Dramatic background layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Dark radial gradient base */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(0_84%_50%_/_0.08)_0%,_transparent_70%)]" />
        
        {/* Animated spotlight beams */}
        <div className="absolute top-0 left-1/4 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent animate-spotlight-sweep" />
        <div className="absolute top-0 right-1/4 w-[2px] h-full bg-gradient-to-b from-transparent via-primary/15 to-transparent animate-spotlight-sweep-delayed" />
        
        {/* Concentric circles emanating from center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px]">
          <div className="absolute inset-0 border border-primary/10 rounded-full animate-ripple" />
          <div className="absolute inset-8 border border-primary/8 rounded-full animate-ripple-delayed" />
          <div className="absolute inset-16 border border-primary/6 rounded-full animate-ripple-slow" />
        </div>
        
        {/* Floating music particles */}
        <div className="absolute top-20 left-[15%] opacity-40">
          <Music className="w-6 h-6 text-primary animate-float-particle" />
        </div>
        <div className="absolute bottom-32 right-[20%] opacity-30">
          <Music className="w-5 h-5 text-primary animate-float-particle-delayed" />
        </div>
        <div className="absolute top-1/3 right-[10%] opacity-25">
          <Music className="w-4 h-4 text-primary animate-float-particle-slow" />
        </div>
        <div className="absolute bottom-1/4 left-[8%] opacity-35">
          <Music className="w-5 h-5 text-primary animate-float-particle" />
        </div>
        
        {/* Corner stage light accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-primary/5 to-transparent" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-primary/5 to-transparent" />
        
        {/* Retro scan lines overlay */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,_transparent,_transparent_2px,_hsl(0_0%_0%_/_0.03)_2px,_hsl(0_0%_0%_/_0.03)_4px)] pointer-events-none" />
      </div>

      {/* Pulsing glow behind video */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-primary/15 rounded-full blur-[100px] animate-video-glow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-primary/10 rounded-full blur-[60px] animate-video-glow-delayed" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header with enhanced styling */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-4">
            <Youtube className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Featured Video</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-3">
            Latest <span className="text-gradient">Video</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Watch the latest beats, tutorials, and behind-the-scenes content
          </p>
        </div>

        {/* YouTube Embed with dramatic frame */}
        <div className="max-w-4xl mx-auto">
          {/* Outer decorative frame */}
          <div className="relative p-1 bg-gradient-to-br from-primary/50 via-primary/20 to-primary/50 rounded-xl">
            {/* Corner brackets */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
            
            {/* Video container */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden animate-video-frame-glow">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?si=rPfQHHkt0FKtIUY9&rel=0`}
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              />
            </div>
          </div>

          {/* Subscribe CTA */}
          <div className="text-center mt-10">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-6 text-lg red-glow hover:scale-105 transition-transform"
            >
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="mr-2" size={24} />
                Subscribe on YouTube
              </a>
            </Button>
            <p className="text-muted-foreground text-sm mt-3">
              Join the community for exclusive content
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
