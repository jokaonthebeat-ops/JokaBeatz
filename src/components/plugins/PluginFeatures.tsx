import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MousePointer2, Sliders, Package, ShieldCheck, Bookmark, Store } from "lucide-react";

const features = [
  {
    icon: MousePointer2,
    title: "No-Code Builder",
    description: "Drag and drop UI elements — knobs, sliders, buttons, displays. Add your logo and brand colors. No coding experience needed.",
  },
  {
    icon: Sliders,
    title: "DSP Library",
    description: "Choose from a curated library of analog-modeled processors: compressors, EQs, saturators, filters, reverbs, and advanced routing utilities.",
  },
  {
    icon: Package,
    title: "Multi-Format Export",
    description: "Export your plugin as VST3, AU, and AAX in a single click. Compatible with every major DAW on Windows and macOS.",
  },
  {
    icon: ShieldCheck,
    title: "Plugin Signing",
    description: "Every exported plugin is code-signed. It loads in your DAW without security warnings or errors — ready for professional distribution.",
  },
  {
    icon: Bookmark,
    title: "Preset Manager",
    description: "Every plugin ships with a built-in preset manager. Create, save, and share presets. Include your own factory presets at no extra cost.",
  },
  {
    icon: Store,
    title: "Marketplace",
    description: "List your plugin on our marketplace, set your price, and we handle delivery. Sell directly to producers and engineers worldwide.",
  },
];

export const PluginFeatures = () => {
  return (
    <section className="py-20 bg-card relative overflow-hidden">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_50%,_hsl(0_84%_50%_/_0.07),_transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_70%_40%,_hsl(0_84%_50%_/_0.05),_transparent)]" />
      </div>

      {/* Orbit blobs */}
      <div className="hidden md:block absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/8 rounded-full blur-3xl animate-morph" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/6 rounded-full blur-3xl animate-morph-delayed" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float-particle-delayed" />
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-primary/30 rounded-full animate-float-particle-slow" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Everything You Need
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Professional Tools,{" "}
            <span className="text-primary">Zero Code</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From GUI design to DSP processing to distribution — every tool you need to ship professional audio plugins is built in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="bg-secondary border-2 border-border card-lift red-glow-hover transition-all duration-300 hover:border-primary/50"
            >
              <CardHeader>
                <div className="p-4 bg-primary/10 rounded-xl relative w-fit mb-3">
                  <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl animate-pulse-glow" />
                  <Icon size={24} className="text-primary relative z-10" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
