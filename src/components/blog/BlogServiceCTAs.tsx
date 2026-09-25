import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Video, Music, Headphones, MessageSquare, Gift } from "lucide-react";

interface Service {
  name: string;
  description: string;
  path: string;
  icon: React.ElementType;
  keywords: string[];
}

const SERVICES: Service[] = [
  {
    name: "AI Mastering",
    description: "Get your tracks mastered from $14.99",
    path: "/ai-mastering",
    icon: Zap,
    keywords: ["master", "mastering", "mixing", "mix", "loudness", "audio quality", "sound quality", "production", "producer"],
  },
  {
    name: "Music Videos",
    description: "AI-powered music videos for your releases",
    path: "/music-videos",
    icon: Video,
    keywords: ["music video", "visual", "visuals", "video", "youtube", "tiktok", "content", "promotional"],
  },
  {
    name: "Custom Beats",
    description: "Commission a beat made just for you",
    path: "/services/custom-beats",
    icon: Music,
    keywords: ["beat", "beats", "instrumental", "track", "rap", "hip hop", "trap", "drill", "custom"],
  },
  {
    name: "Free Beats",
    description: "Download free beats to start creating",
    path: "/free-beats",
    icon: Gift,
    keywords: ["free beat", "free music", "download", "get started", "beginner"],
  },
  {
    name: "Consultation",
    description: "30-min 1-on-1 music industry strategy session",
    path: "/services/consultation",
    icon: MessageSquare,
    keywords: ["consult", "strategy", "business", "branding", "brand", "marketing", "release", "distribution", "spotify", "playlist", "label", "deal", "income", "revenue", "monetize", "fan base", "fanbase", "direct-to-fan", "direct to fan"],
  },
];

interface BlogServiceCTAsProps {
  content: string;
  title: string;
  category: string;
}

export const BlogServiceCTAs = ({ content, title, category }: BlogServiceCTAsProps) => {
  const combined = `${title} ${content} ${category}`.toLowerCase();

  const matched = SERVICES.filter((service) =>
    service.keywords.some((kw) => combined.includes(kw))
  );

  // Always show at least mastering (our core service)
  const hasCore = matched.some((s) => s.path === "/ai-mastering");
  const services = hasCore ? matched : [SERVICES[0], ...matched].slice(0, 3);

  // Dedupe and limit to 3
  const unique = Array.from(new Map(services.map((s) => [s.path, s])).values()).slice(0, 3);

  if (unique.length === 0) return null;

  return (
    <div className="my-10 rounded-2xl border border-primary/20 bg-primary/5 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-primary mb-1">
        Mentioned in this article
      </h3>
      <p className="text-muted-foreground text-sm mb-5">
        Ready to take action? Check out our services below.
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {unique.map((service) => {
          const Icon = service.icon;
          return (
            <Button key={service.path} asChild variant="outline" className="border-primary/30 hover:border-primary hover:bg-primary/10 group">
              <Link to={service.path}>
                <Icon className="w-4 h-4 mr-2 text-primary" />
                <span>
                  <span className="font-semibold">{service.name}</span>
                  <span className="text-muted-foreground text-xs ml-2 hidden sm:inline">— {service.description}</span>
                </span>
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
