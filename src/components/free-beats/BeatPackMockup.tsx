import jokaBeatzLogo from "@/assets/joka-beatz-logo.png";

const BeatPackMockup = () => {
  return (
    <div className="relative max-w-xs mx-auto">
      {/* Floating glow effect */}
      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
      
      {/* Main card with float animation */}
      <div className="relative animate-[float_6s_ease-in-out_infinite]">
        {/* Stacked cards behind - smaller offset on mobile */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4 w-full h-full bg-secondary/50 rounded-xl md:rounded-2xl border border-border transform rotate-3" />
        <div className="absolute top-1 left-1 md:top-2 md:left-2 w-full h-full bg-secondary/70 rounded-xl md:rounded-2xl border border-border transform rotate-1" />
        
        {/* Main beat pack card */}
        <div className="relative bg-gradient-to-br from-secondary via-background to-secondary rounded-xl md:rounded-2xl border-2 border-primary p-4 md:p-6 red-glow">
          {/* Badge */}
          <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-primary text-primary-foreground text-[10px] md:text-xs font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full red-glow">
            FREE
          </div>
          
          {/* Album art style container with logo */}
          <div className="aspect-square bg-gradient-to-br from-primary/20 via-background to-primary/10 rounded-lg md:rounded-xl mb-3 md:mb-4 flex items-center justify-center relative overflow-hidden">
            {/* Background waveform visual - fewer bars on mobile */}
            <div className="absolute inset-0 flex items-center justify-center gap-0.5 md:gap-1 px-2 md:px-4 opacity-30">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary/60 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Logo */}
            <img 
              src={jokaBeatzLogo} 
              alt="Joka Beatz" 
              className="relative z-10 w-3/4 h-auto drop-shadow-2xl"
            />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg md:text-2xl font-black text-foreground mb-0.5 md:mb-1">5 FREE BEATS</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">MP3 Files</p>
            
            {/* Genre tags - smaller on mobile, show fewer */}
            <div className="flex flex-wrap justify-center gap-1 md:gap-2">
              {["Hip Hop", "Trap", "R&B", "Drill", "AfroBeat"].map((genre) => (
                <span
                  key={genre}
                  className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-primary/10 text-primary rounded-full border border-primary/30"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeatPackMockup;
