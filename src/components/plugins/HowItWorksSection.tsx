import { Layout, Cpu, Download, DollarSign } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Layout,
    title: "Design Your GUI",
    description: "Drag knobs, sliders, and displays onto your canvas. Add your logo, choose colors, and customize the layout to match your brand.",
  },
  {
    number: 2,
    icon: Cpu,
    title: "Add DSP Components",
    description: "Choose from our library of analog-modeled processors. Chain them in any configuration and audition the result directly in your browser.",
  },
  {
    number: 3,
    icon: Download,
    title: "Export & Sign",
    description: "One click exports your plugin to VST3, AU, and AAX. We sign it automatically so it loads in any DAW without warnings.",
  },
  {
    number: 4,
    icon: DollarSign,
    title: "Sell on Marketplace",
    description: "List your plugin, set your price, and we handle delivery and payments. Your plugin reaches producers and engineers worldwide.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,_hsl(0_84%_50%_/_0.08),_transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,_hsl(0_84%_50%_/_0.06),_transparent)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-1 h-1 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float-particle-delayed" />
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-primary/30 rounded-full animate-float-particle-slow" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Simple Process
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            From Idea to Plugin in{" "}
            <span className="text-primary">4 Steps</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our streamlined workflow takes you from concept to distributable, signed plugin in days — not months.
          </p>
        </div>

        {/* Desktop: horizontal steps with connector */}
        <div className="hidden md:block max-w-5xl mx-auto">
          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px bg-border z-0" />

            <div className="grid grid-cols-4 gap-6 relative z-10">
              {steps.map(({ number, icon: Icon, title, description }) => (
                <div key={number} className="flex flex-col items-center text-center">
                  {/* Number circle */}
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground font-black text-xl flex items-center justify-center mb-4 shadow-lg red-glow relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse-glow" />
                    <span className="relative z-10">{number}</span>
                  </div>

                  {/* Icon */}
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl mb-4">
                    <Icon size={20} className="text-primary" />
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: vertical steps with left border */}
        <div className="md:hidden max-w-sm mx-auto">
          <div className="relative pl-10">
            {/* Vertical connector */}
            <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

            <div className="space-y-10">
              {steps.map(({ number, icon: Icon, title, description }) => (
                <div key={number} className="relative">
                  {/* Step dot on connector */}
                  <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-black text-sm flex items-center justify-center red-glow">
                    {number}
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">{title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
