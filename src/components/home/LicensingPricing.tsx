import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

const licensingTiers = [
  {
    name: "MP3 Lease",
    price: "$29.99",
    popular: false,
    bestFor: "Best for demos & budget releases",
    features: [
      "MP3 (320kbps)",
      "Non-exclusive",
      "Streaming allowed",
      "1 monetized video",
      "Credit required",
    ],
  },
  {
    name: "WAV Lease",
    price: "$59.99",
    popular: true,
    bestFor: "Best for official singles",
    features: [
      "WAV (24-bit)",
      "Non-exclusive",
      "Streaming platforms",
      "1 monetized video",
      "Radio/DJ use",
      "Credit required",
    ],
  },
  {
    name: "Unlimited Lease",
    price: "$199.99",
    popular: false,
    bestFor: "Best for serious releases",
    features: [
      "WAV (24-bit)",
      "Unlimited streams",
      "Unlimited videos",
      "Full mixing control",
      "Credit required",
    ],
  },
  {
    name: "Exclusive Rights",
    price: "Starting at $499.99",
    popular: false,
    bestFor: "Full ownership",
    features: [
      "Beat removed from store",
      "WAV + Stems",
      "Unlimited use",
      "Contract provided",
      "Contact required",
    ],
  },
];

interface LicensingPricingProps {
  showHeader?: boolean;
  showInfoCallout?: boolean;
}

export const LicensingPricing = ({ 
  showHeader = true, 
  showInfoCallout = true 
}: LicensingPricingProps) => {
  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Animated gradient mesh background */}
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

      {/* Diagonal light streaks */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-1/2 -left-1/4 w-full h-[200%] bg-gradient-to-br from-transparent via-primary/10 to-transparent rotate-12 animate-light-streak" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {showHeader && (
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              Beat Licensing Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              This table is for reference only. All licenses are purchased inside the BeatStars player above.
            </p>
          </div>
        )}

        {showInfoCallout && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-primary mt-0.5 flex-shrink-0" size={20} />
              <p className="text-sm text-foreground">
                <strong>How it works:</strong> Choose a beat in the player → select license → checkout → instant download.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {licensingTiers.map((tier, index) => (
            <Card
              key={index}
              className={`bg-card relative transition-all duration-300 card-lift red-glow-hover cursor-default ${
                tier.popular 
                  ? "border-2 border-primary red-glow" 
                  : "border-2 border-border hover:border-primary/50"
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-xl font-bold text-foreground">
                  {tier.name}
                </CardTitle>
                <div className="text-3xl font-black text-primary mt-2">
                  {tier.price}
                </div>
                <CardDescription className="text-muted-foreground mt-2">
                  {tier.bestFor}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle size={16} className="text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs text-center text-muted-foreground border-t border-border pt-4">
                  How to buy: Inside BeatStars player above
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
