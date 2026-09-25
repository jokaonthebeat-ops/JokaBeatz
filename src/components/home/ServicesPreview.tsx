import { Link } from "react-router-dom";
import { Music, Sliders, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Music,
    title: "Custom Beats",
    description: "Exclusive production tailored to your sound.",
    priceLabel: "$300",
    path: "/services/custom-beats",
  },
  {
    icon: Sliders,
    title: "Mixing & Mastering",
    description: "AI-powered mastering from $14.99. Professional mixing also available.",
    priceLabel: "From $14.99",
    path: "/ai-mastering",
  },
  {
    icon: Users,
    title: "1-on-1 Consultation",
    description: "30-min artist strategy, branding, and release guidance.",
    priceLabel: "$100",
    path: "/services/consultation",
  },
];

export const ServicesPreview = () => {
  return (
    <section className="py-20 bg-card relative overflow-hidden">
      {/* Floating orbs background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-orbit" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/8 rounded-full blur-3xl animate-orbit-reverse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Gradient blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl animate-morph" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl animate-morph-delayed" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Studio Services
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {services.map((service, index) => (
            <Card key={index} className="bg-secondary border-border hover:border-primary transition-all card-lift h-full backdrop-blur-sm bg-secondary/80 flex flex-col">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow" />
                  <service.icon size={32} className="text-primary relative z-10" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {service.title}
                </CardTitle>
                <Badge className="bg-primary/10 text-primary mt-2 mx-auto">
                  {service.priceLabel}
                </Badge>
              </CardHeader>
              <CardContent className="text-center flex-1 flex flex-col">
                <CardDescription className="text-muted-foreground flex-1">
                  {service.description}
                </CardDescription>
                <Button
                  asChild
                  className="mt-4 w-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-colors"
                >
                  <Link to={service.path}>
                    Order Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
