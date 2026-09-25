import { BookOpen } from "lucide-react";

const EbookMockup = () => {
  return (
    <div className="relative w-full max-w-sm mx-auto perspective-1000">
      {/* Floating animation container */}
      <div className="animate-float">
        {/* Stacked pages for 3D depth */}
        <div className="absolute inset-0 transform translate-x-2 translate-y-2 bg-muted/50 rounded-lg" />
        <div className="absolute inset-0 transform translate-x-1 translate-y-1 bg-muted/70 rounded-lg" />
        
        {/* Main book cover */}
        <div className="relative bg-gradient-to-br from-primary/20 via-background to-secondary rounded-lg border-2 border-primary/30 shadow-2xl overflow-hidden transform hover:scale-105 transition-transform duration-500 red-glow">
          {/* FREE badge */}
          <div className="absolute -top-1 -right-1 z-20">
            <div className="bg-primary text-primary-foreground text-xs font-black px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-lg animate-pulse-glow">
              FREE
            </div>
          </div>

          {/* Book cover content */}
          <div className="aspect-[3/4] p-6 flex flex-col justify-between relative">
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 bg-primary/30 rounded-full blur-3xl" />
              <div className="absolute bottom-4 right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
            </div>

            {/* Header */}
            <div className="relative z-10">
              <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                Sync Licensing Guide
              </div>
              <div className="w-12 h-0.5 bg-primary/50" />
            </div>

            {/* Center content */}
            <div className="relative z-10 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground leading-tight">
                  Get Your Music
                </h3>
                <h3 className="text-xl font-black text-primary leading-tight">
                  Placed in 2026
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                The Complete Sync Licensing Playbook
              </p>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between text-xs text-muted-foreground">
              <span>SyncStarz</span>
              <span>2026 Edition</span>
            </div>

            {/* Spine effect */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/50 via-primary/20 to-primary/50" />
          </div>
        </div>
      </div>

      {/* Reflection effect */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary/10 blur-xl rounded-full" />
    </div>
  );
};

export default EbookMockup;
