import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const pluginTiers = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    popular: false,
    bestFor: "Try the builder risk-free",
    features: [
      "3 plugin projects",
      "VST3 export",
      "Basic DSP components",
      "Preset manager included",
      "Community support",
      "Watermarked output",
    ],
    cta: "Start Free",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    popular: true,
    bestFor: "Serious plugin creators",
    features: [
      "Unlimited projects",
      "VST3 + AU + AAX export",
      "Full DSP library",
      "Code signing included",
      "Marketplace listing",
      "10% sales commission",
      "Priority support",
    ],
    cta: "Start Building",
    ctaVariant: "default" as const,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    popular: false,
    bestFor: "Labels & plugin studios",
    features: [
      "White-label builder",
      "Custom DSP modules",
      "Reduced commission",
      "Dedicated account manager",
      "API access",
      "SLA guarantee",
    ],
    cta: "Contact Us",
    ctaVariant: "outline" as const,
  },
];

export const CreatorPricing = () => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,_hsl(0_84%_50%_/_0.08),_transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,_hsl(0_84%_50%_/_0.06),_transparent)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-1 h-1 bg-primary/40 rounded-full animate-float-particle" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary/20 rounded-full animate-float-particle-delayed" />
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-primary/30 rounded-full animate-float-particle-slow" />
        <div className="absolute top-1/2 left-10 w-1 h-1 bg-primary/50 rounded-full animate-float-particle" />
        <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-primary/25 rounded-full animate-float-particle-delayed" />
      </div>

      {/* Diagonal light streak */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-1/2 -left-1/4 w-full h-[200%] bg-gradient-to-br from-transparent via-primary/10 to-transparent rotate-12 animate-light-streak" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            Creator Plans
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Simple, <span className="text-primary">Transparent Pricing</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no long-term contracts — just pay for what you need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pluginTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`bg-card relative transition-all duration-300 card-lift ${
                tier.popular
                  ? "border-2 border-primary red-glow"
                  : "border-2 border-border hover:border-primary/50 red-glow-hover"
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-xl font-bold text-foreground">{tier.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-4xl font-black text-primary">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground text-sm">{tier.period}</span>}
                </div>
                <CardDescription className="text-muted-foreground mt-2">{tier.bestFor}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col">
                <ul className="space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle size={16} className="text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.ctaVariant}
                  className={`w-full mt-6 font-bold min-h-[44px] ${
                    tier.popular
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground red-glow red-glow-hover"
                      : ""
                  }`}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          All plans include the preset manager. Marketplace commission applies to Pro and Enterprise only.
        </p>
      </div>
    </section>
  );
};
