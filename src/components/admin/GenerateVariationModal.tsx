import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate } from "@/hooks/useEmailTemplates";

interface GenerateVariationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: EmailTemplate | null;
  onUseVariation: (subject: string, content: string) => void;
}

type VariationType = "subject_only" | "full_variation" | "tone_shift";
type Tone = "urgent" | "casual" | "professional" | "exclusive";

const GenerateVariationModal = ({
  open,
  onOpenChange,
  template,
  onUseVariation,
}: GenerateVariationModalProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [variationType, setVariationType] = useState<VariationType>("subject_only");
  const [tone, setTone] = useState<Tone>("professional");
  const [results, setResults] = useState<string[] | { subject: string; content: string } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!template) return;

    setIsGenerating(true);
    setResults(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("generate-email-variation", {
        body: {
          variationType,
          tone: variationType === "tone_shift" ? tone : undefined,
          originalSubject: template.subject,
          originalContent: template.content,
          category: template.category,
        },
      });

      if (error) throw error;

      if (data.success) {
        setResults(data.result);
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySubject = (subject: string, index: number) => {
    navigator.clipboard.writeText(subject);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Subject line copied to clipboard",
    });
  };

  const handleUseSubject = (subject: string) => {
    if (template) {
      onUseVariation(subject, template.content);
      onOpenChange(false);
      setResults(null);
    }
  };

  const handleUseFullVariation = () => {
    if (results && typeof results === "object" && "subject" in results) {
      onUseVariation(results.subject, results.content);
      onOpenChange(false);
      setResults(null);
    }
  };

  const resetState = () => {
    setResults(null);
    setVariationType("subject_only");
    setTone("professional");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Variation
          </DialogTitle>
          <DialogDescription>
            Use AI to create fresh variations of "{template?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Variation Type */}
          <div className="space-y-3">
            <Label>What do you want to generate?</Label>
            <RadioGroup
              value={variationType}
              onValueChange={(v) => {
                setVariationType(v as VariationType);
                setResults(null);
              }}
              className="grid grid-cols-1 gap-2"
            >
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="subject_only" id="subject_only" />
                <div>
                  <p className="font-medium text-sm">Subject Lines Only</p>
                  <p className="text-xs text-muted-foreground">Get 5 alternative subject lines</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="tone_shift" id="tone_shift" />
                <div>
                  <p className="font-medium text-sm">Tone Shift</p>
                  <p className="text-xs text-muted-foreground">Rewrite with a different tone</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                <RadioGroupItem value="full_variation" id="full_variation" />
                <div>
                  <p className="font-medium text-sm">Full Variation</p>
                  <p className="text-xs text-muted-foreground">Complete new version with same purpose</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Tone Selection (for tone_shift) */}
          {variationType === "tone_shift" && (
            <div className="space-y-3">
              <Label>Select tone</Label>
              <RadioGroup
                value={tone}
                onValueChange={(v) => setTone(v as Tone)}
                className="grid grid-cols-2 gap-2"
              >
                <label className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <div>
                    <p className="font-medium text-sm">🔥 Urgent</p>
                    <p className="text-xs text-muted-foreground">Limited time, act now</p>
                  </div>
                </label>
                <label className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="casual" id="casual" />
                  <div>
                    <p className="font-medium text-sm">😎 Casual</p>
                    <p className="text-xs text-muted-foreground">Friendly, conversational</p>
                  </div>
                </label>
                <label className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="professional" id="professional" />
                  <div>
                    <p className="font-medium text-sm">💼 Professional</p>
                    <p className="text-xs text-muted-foreground">Polished, business-like</p>
                  </div>
                </label>
                <label className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="exclusive" id="exclusive" />
                  <div>
                    <p className="font-medium text-sm">⭐ Exclusive</p>
                    <p className="text-xs text-muted-foreground">VIP, special access</p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Variation
              </>
            )}
          </Button>

          {/* Results */}
          {results && (
            <div className="space-y-3 pt-4 border-t border-border">
              <Label>Generated Results</Label>

              {/* Subject lines array */}
              {Array.isArray(results) && (
                <div className="space-y-2">
                  {results.map((subject, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <p className="text-sm flex-1 pr-2">{subject}</p>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopySubject(subject, index)}
                        >
                          {copiedIndex === index ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleUseSubject(subject)}
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Full variation result */}
              {typeof results === "object" && "subject" in results && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">New Subject</p>
                    <p className="text-sm font-medium">{results.subject}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg max-h-[200px] overflow-y-auto">
                    <p className="text-xs text-muted-foreground mb-1">New Content Preview</p>
                    <p className="text-xs font-mono whitespace-pre-wrap">
                      {results.content.length > 500
                        ? results.content.slice(0, 500) + "..."
                        : results.content}
                    </p>
                  </div>
                  <Button onClick={handleUseFullVariation} className="w-full">
                    Use This Variation
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateVariationModal;
