import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ShareButtons from "@/components/free-beats/ShareButtons";
import { getServiceShareContent } from "@/lib/shareContent";

interface ServiceHeroProps {
  icon: LucideIcon;
  title: string;
  description: string;
  price: number;
  turnaround: string;
  path?: string;
}

export const ServiceHero = ({
  icon: Icon,
  title,
  description,
  price,
  turnaround,
  path,
}: ServiceHeroProps) => {
  const serviceShareContent = getServiceShareContent(title);
  
  return (
    <section className="py-12 md:py-20 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-orbit" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/8 rounded-full blur-3xl animate-orbit-reverse" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mx-auto mb-6 p-4 bg-primary/10 rounded-full w-fit relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-glow" />
            <Icon size={48} className="text-primary relative z-10" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
            {title}
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground mb-6">
            {description}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            <Badge className="bg-primary text-primary-foreground text-xl md:text-2xl font-bold px-6 py-2">
              ${price}
            </Badge>
            <Badge variant="outline" className="text-sm md:text-base px-4 py-2">
              {turnaround}
            </Badge>
          </div>

          {path && (
            <div className="flex justify-center">
              <ShareButtons 
                title={`${title} | Joka Beatz`} 
                path={path}
                caption={serviceShareContent.caption}
                hashtags={serviceShareContent.hashtags}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
