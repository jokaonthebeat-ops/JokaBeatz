export const BeatStarsPlayer = () => {
  return (
    <section id="beatstars-player" className="py-12 md:py-20 bg-card relative overflow-hidden">
      {/* Animated waveform background - hidden on mobile for performance */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30 hidden md:block">
        <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-around gap-1 px-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-1 md:w-2 bg-primary/60 rounded-t animate-equalizer"
              style={{
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Pulsing glow orbs - hidden on mobile */}
      <div className="hidden md:block">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl animate-pulse-glow-delayed" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-6 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 md:mb-4">
            Listen & License Beats
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            All beat purchases and licenses are completed directly inside the player below.
          </p>
        </div>

        {/* BeatStars Embed Container */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-secondary rounded-lg p-1 red-glow">
            <div className="bg-background rounded-lg overflow-hidden border border-border">
              <iframe 
                src="https://player.beatstars.com/?storeId=113791" 
                width="100%" 
                className="min-h-[500px] md:min-h-[700px] lg:min-h-[900px]"
                style={{ border: 'none' }}
                title="BeatStars Beat Player - Browse and License Hip Hop, Trap, R&B Beats for Sale"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
