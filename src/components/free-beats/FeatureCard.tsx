import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <div className="flex items-start gap-3 p-3 md:p-4 bg-secondary/30 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
      <div className="p-2 md:p-3 bg-primary/10 rounded-lg red-glow shrink-0">
        <Icon size={20} className="text-primary md:w-6 md:h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-bold text-foreground text-sm md:text-base mb-0.5 md:mb-1">{title}</h4>
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
