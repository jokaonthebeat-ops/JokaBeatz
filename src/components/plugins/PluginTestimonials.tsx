import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote: "Built my first reverb plugin in a weekend with zero code experience. It's live on the marketplace making money every week.",
    name: "Jordan M.",
    role: "Independent Producer",
    initials: "JM",
  },
  {
    quote: "The DSP library has everything. Analog-modeled saturation, proper sidechain routing, parallel compression — it just works and sounds incredible.",
    name: "Keisha T.",
    role: "Mixing Engineer",
    initials: "KT",
  },
  {
    quote: "Exported to VST3, AU, and AAX in one click. Loaded in Pro Tools first try, no security warnings, no drama. Exactly what I needed.",
    name: "Alex R.",
    role: "Plugin Developer",
    initials: "AR",
  },
];

export const PluginTestimonials = () => {
  return (
    <section className="py-20 bg-card relative overflow-hidden">
      {/* Orbit blobs */}
      <div className="hidden md:block absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-10 -left-10 w-56 h-56 bg-primary/6 rounded-full blur-3xl animate-orbit" />
        <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-orbit-reverse" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float-particle-delayed" />
        <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-primary/30 rounded-full animate-float-particle-slow" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Creator Stories
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Loved by <span className="text-primary">Creators Worldwide</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Producers, engineers, and developers are shipping professional audio plugins with our platform every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map(({ quote, name, role, initials }) => (
            <Card
              key={name}
              className="bg-secondary border-2 border-border card-lift cursor-default transition-all duration-300 hover:border-primary/40"
            >
              <CardContent className="pt-6">
                <div className="text-5xl font-black text-primary/25 leading-none mb-3">"</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                  {quote}
                </p>
                <div className="flex items-center gap-3 border-t border-border pt-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-xs">{initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
