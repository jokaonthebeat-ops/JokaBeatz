import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Music, Film, Megaphone, ShoppingBag, Briefcase, Gift, UserCheck, Sparkles } from "lucide-react";
import { EmailTemplate } from "@/hooks/useEmailTemplates";

interface EmailTemplateCardProps {
  template: EmailTemplate;
  onSelect: (template: EmailTemplate) => void;
  onPreview: (template: EmailTemplate) => void;
  onGenerateVariation?: (template: EmailTemplate) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  free_beats: <Music className="h-4 w-4" />,
  sync_guide: <Film className="h-4 w-4" />,
  announcement: <Megaphone className="h-4 w-4" />,
  general: <FileText className="h-4 w-4" />,
  products: <ShoppingBag className="h-4 w-4" />,
  services: <Briefcase className="h-4 w-4" />,
  seasonal: <Gift className="h-4 w-4" />,
  re_engagement: <UserCheck className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  free_beats: "bg-green-500/20 text-green-400 border-green-500/30",
  sync_guide: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  announcement: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  general: "bg-muted text-muted-foreground border-border",
  products: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  services: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  seasonal: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  re_engagement: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const EmailTemplateCard = ({ template, onSelect, onPreview, onGenerateVariation }: EmailTemplateCardProps) => {
  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {categoryIcons[template.category] || <FileText className="h-4 w-4" />}
            </div>
            <div>
              <h4 className="font-medium text-foreground text-sm leading-tight">{template.name}</h4>
              <Badge 
                variant="outline" 
                className={`text-xs mt-1 ${categoryColors[template.category] || categoryColors.general}`}
              >
                {template.category.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {template.description || "No description"}
        </p>

        <p className="text-xs text-foreground/70 mb-4 line-clamp-1 font-medium">
          Subject: {template.subject}
        </p>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onPreview(template)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          {onGenerateVariation && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs px-2"
              onClick={() => onGenerateVariation(template)}
              title="Generate AI variation"
            >
              <Sparkles className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 text-xs bg-primary hover:bg-primary/90"
            onClick={() => onSelect(template)}
          >
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateCard;
