import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoStyleCardProps {
  title: string;
  description: string;
  price: number;
  features: string[];
  isSelected: boolean;
  onSelect: () => void;
  demoUrl?: string | null;
}

export const VideoStyleCard = ({
  title,
  description,
  price,
  features,
  isSelected,
  onSelect,
  demoUrl,
}: VideoStyleCardProps) => {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.02]",
        isSelected
          ? "border-primary bg-primary/10 red-glow"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      {isSelected && (
        <div className="absolute -top-3 -right-3 bg-primary rounded-full p-2">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      <h3 className="text-2xl font-black text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>

      <div className="mb-6">
        <span className="text-4xl font-black text-primary">${price}</span>
        <span className="text-muted-foreground">/video</span>
      </div>

      {demoUrl && (
        <div className="mb-4 rounded-lg overflow-hidden aspect-video bg-black/50">
          <video
            src={demoUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            autoPlay
          />
        </div>
      )}

      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="w-4 h-4 text-primary shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};
