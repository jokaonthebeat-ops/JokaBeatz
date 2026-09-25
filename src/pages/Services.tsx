import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Wand2, Users, CheckCircle, Clock, Target, ArrowRight, Sparkles } from "lucide-react";
import { MultipleServicesSchema } from "@/components/seo/ProductSchema";
import { BreadcrumbSchema } from "@/components/seo/StructuredData";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { getPageShareContent } from "@/lib/shareContent";

const services = [
  {
    icon: Music,
    title: "Custom Beats",
    description: "Get exclusive production crafted specifically for your project and sound.",
    price: "$300",
    path: "/services/custom-beats",
    whatsIncluded: [
      "Initial consultation to understand your vision",
      "2-3 beat concepts to choose from",
      "Unlimited revisions until you're satisfied",
      "Full ownership of the final beat",
      "WAV + stems delivery",
    ],
    whoItsFor: "Solo artists, labels, and projects that need a unique sound that no one else has.",
    turnaround: "3-5 business days",
    serviceType: "Music Production",
    badge: null,
  },
  {
    icon: Wand2,
    title: "Mixing & Mastering",
    description: "AI-powered mastering with instant results, plus professional mixing services. All in one place.",
    price: "From $9.99",
    path: "/ai-mastering",
    whatsIncluded: [
      "AI Mastering with free preview",
      "Professional mixing available",
      "Multiple genre presets",
      "Streaming-optimized loudness",
      "High-quality WAV download",
    ],
    whoItsFor: "Artists who need their tracks mixed or mastered for release.",
    turnaround: "Minutes (AI) to 3-5 days (Mixing)",
    serviceType: "Audio Services",
    badge: "AI-POWERED",
  },
  {
    icon: Users,
    title: "1-on-1 Consultation",
    description: "Personal guidance on your music career, release strategy, and brand.",
    price: "$100",
    path: "/services/consultation",
    whatsIncluded: [
      "30-minute video call",
      "Release strategy planning",
      "Branding and image guidance",
      "Marketing tips and tactics",
      "Follow-up notes and action items",
    ],
    whoItsFor: "Emerging artists who want direction and a clear path forward in their career.",
    turnaround: "Scheduled within 1 week",
    serviceType: "Music Consultation",
    badge: null,
  },
];

const Services = () => {
  return (
    <Layout
      path="/services"
      seoTitle="Music Production Services | Custom Beats & Mastering"
      seoDescription="Professional music production services from Joka Beatz: custom beats, AI mastering, music videos and 1-on-1 artist consultations with fast turnaround."
      seoKeywords="music production services, custom beats, online mastering, mixing services, music video production, artist consultation"
    >
      <MultipleServicesSchema 
        services={services.map(s => ({
          name: s.title,
          description: s.description,
          serviceType: s.serviceType,
        }))}
      />
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://jokabeatz.com/" },
          { name: "Services", url: "https://jokabeatz.com/services" },
        ]} 
      />

      {/* Header */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            Music Production Services
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Professional studio services to take your music to the next level.
          </p>
          <div className="flex justify-center">
            <ShareButtons 
              title="Music Production Services | Joka Beatz" 
              path="/services"
              caption={getPageShareContent("services").caption}
              hashtags={getPageShareContent("services").hashtags}
            />
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-8 md:py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="space-y-8 md:space-y-16 max-w-5xl mx-auto">
            {services.map((service, index) => (
              <Card
                key={index}
                className={`bg-secondary border-border overflow-hidden card-lift ${
                  service.badge ? 'border-primary/30' : ''
                }`}
              >
                <CardHeader className="bg-background/50 border-b border-border p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={`p-3 md:p-4 rounded-lg shrink-0 ${
                        service.badge ? 'bg-primary/20 animate-pulse-glow' : 'bg-primary/10'
                      }`}>
                        <service.icon size={28} className="text-primary md:w-8 md:h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl md:text-2xl font-bold text-foreground">
                            {service.title}
                          </CardTitle>
                          {service.badge && (
                            <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              {service.badge}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-muted-foreground mt-1 text-sm md:text-base">
                          {service.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`text-lg md:text-xl font-bold px-4 py-1.5 shrink-0 ${
                      service.badge 
                        ? 'bg-primary text-primary-foreground red-glow' 
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {service.price}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* What's Included */}
                    <div>
                      <h3 className="font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                        <CheckCircle size={18} className="text-primary shrink-0" />
                        What's Included
                      </h3>
                      <ul className="space-y-2">
                        {service.whatsIncluded.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-xs md:text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-0.5 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Who It's For */}
                    <div>
                      <h3 className="font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                        <Target size={18} className="text-primary shrink-0" />
                        Who It's For
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {service.whoItsFor}
                      </p>
                    </div>

                    {/* Turnaround */}
                    <div>
                      <h3 className="font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base">
                        <Clock size={18} className="text-primary shrink-0" />
                        Turnaround Time
                      </h3>
                      <p className={`text-xs md:text-sm ${
                        service.badge ? 'text-primary font-bold' : 'text-muted-foreground'
                      }`}>
                        {service.turnaround}
                      </p>
                    </div>
                  </div>
                  
                  {/* Order Button */}
                  <div className="mt-6 pt-4 border-t border-border">
                    <Button
                      asChild
                      className={`w-full font-bold py-5 ${
                        service.badge 
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground red-glow red-glow-hover'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground red-glow red-glow-hover'
                      }`}
                    >
                      <Link to={service.path}>
                        {service.badge ? 'Try AI Mastering Free' : `Order Now - ${service.price}`}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-4">
            Ready to level up your sound?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 max-w-xl mx-auto">
            Let's discuss your project and find the right service for your needs.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 red-glow red-glow-hover min-h-[48px]"
          >
            <Link to="/contact">Contact Joka Beatz</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
