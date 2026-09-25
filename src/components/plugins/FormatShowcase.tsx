import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Laptop, Headphones } from "lucide-react";

const formats = [
  {
    acronym: "VST3",
    icon: Monitor,
    name: "Virtual Studio Technology 3",
    platforms: "Windows & macOS",
    description: "The industry standard plugin format. Supports advanced features like note expressions, dynamic I/O, and efficient processing.",
    daws: ["Ableton Live", "FL Studio", "Cubase", "Studio One", "Reaper", "Bitwig"],
    popular: false,
  },
  {
    acronym: "AU",
    icon: Laptop,
    name: "Audio Units",
    platforms: "macOS only",
    description: "Apple's native plugin format. First-class support in Logic Pro, with tight OS integration and the lowest possible latency.",
    daws: ["Logic Pro", "GarageBand", "MainStage", "Ableton Live (Mac)", "Reaper (Mac)"],
    popular: true,
    popularLabel: "Most Common",
  },
  {
    acronym: "AAX",
    icon: Headphones,
    name: "Avid Audio eXtension",
    platforms: "Windows & macOS",
    description: "The only format supported by Pro Tools. Required for professional studio and broadcast workflows worldwide.",
    daws: ["Pro Tools", "Pro Tools Ultimate", "Pro Tools | Carbon"],
    popular: false,
  },
];

export const FormatShowcase = () => {
  return (
    <section className="py-20 bg-card relative overflow-hidden" id="marketplace">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,_hsl(0_84%_50%_/_0.07),_transparent)]" />
      </div>

      {/* Light streak */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20 hidden md:block">
        <div className="absolute -top-1/2 -right-1/4 w-full h-[200%] bg-gradient-to-bl from-transparent via-primary/10 to-transparent -rotate-12 animate-light-streak" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-1/3 w-1.5 h-1.5 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute bottom-16 right-1/3 w-1 h-1 bg-primary/30 rounded-full animate-float-particle-delayed" />
        <div className="absolute top-1/2 left-10 w-2 h-2 bg-primary/20 rounded-full animate-float-particle-slow" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Universal Compatibility
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Works in <span className="text-primary">Every DAW</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Export to all three major plugin formats in a single click. Your plugin works in every professional DAW on the market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {formats.map(({ acronym, icon: Icon, name, platforms, description, daws, popular, popularLabel }) => (
            <Card
              key={acronym}
              className={`relative transition-all duration-300 card-lift cursor-default ${
                popular
                  ? "border-2 border-primary red-glow bg-secondary"
                  : "border-2 border-border hover:border-primary/50 bg-secondary red-glow-hover"
              }`}
            >
              {popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  {popularLabel}
                </Badge>
              )}
              <CardHeader className="text-center pt-8">
                <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-3">
                  <Icon size={22} className="text-primary" />
                </div>
                <div className="text-5xl font-black text-gradient">{acronym}</div>
                <p className="text-sm font-semibold text-foreground mt-1">{name}</p>
                <p className="text-xs text-muted-foreground">{platforms}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Compatible DAWs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {daws.map((daw) => (
                      <Badge key={daw} variant="outline" className="text-[10px] border-border text-muted-foreground">
                        {daw}
                      </Badge>
                    ))}
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
