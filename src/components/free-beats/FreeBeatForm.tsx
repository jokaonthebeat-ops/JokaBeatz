import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Sparkles } from "lucide-react";

const genres = [
  "Hip Hop",
  "R&B",
  "Trap",
  "AfroBeat",
  "Pop",
  "Drill",
  "Lo-Fi",
  "Other",
];

interface FreeBeatFormProps {
  onSuccess: () => void;
}

const FreeBeatForm = ({ onSuccess }: FreeBeatFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [genre, setGenre] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast({
        title: "Error",
        description: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("free_beat_requests")
        .insert({
          name: name.trim(),
          email: email.trim(),
          genre: genre || null,
        });

      if (error) throw error;

      // Send the free beats email
      const { error: emailError } = await supabase.functions.invoke("send-free-beats-email", {
        body: {
          name: name.trim(),
          email: email.trim(),
        },
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the whole flow if email fails
      }

      onSuccess();
      toast({
        title: "Success!",
        description: "Check your email for your download link.",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Glow effect behind card */}
      <div className="absolute -inset-1 bg-primary/20 rounded-xl md:rounded-2xl blur-xl" />
      
      {/* Form card */}
      <div className="relative bg-gradient-to-br from-secondary via-background to-secondary rounded-xl md:rounded-2xl border-2 border-primary/50 p-5 md:p-8 red-glow">
        {/* Badge */}
        <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
          <Sparkles size={14} className="text-primary md:w-4 md:h-4" />
          <span className="text-xs md:text-sm font-bold text-primary uppercase tracking-wider">
            Free Download
          </span>
          <Sparkles size={14} className="text-primary md:w-4 md:h-4" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="name" className="text-foreground font-semibold text-sm md:text-base">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground h-11 md:h-12 text-base"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="email" className="text-foreground font-semibold text-sm md:text-base">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground h-11 md:h-12 text-base"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="genre" className="text-foreground font-semibold text-sm md:text-base">
              Favorite Genre <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Select value={genre} onValueChange={setGenre} disabled={isLoading}>
              <SelectTrigger className="bg-background border-border text-foreground h-11 md:h-12 text-base">
                <SelectValue placeholder="Select a genre" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {genres.map((g) => (
                  <SelectItem key={g} value={g} className="text-foreground">
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 md:h-14 text-base md:text-lg red-glow red-glow-hover"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2" size={18} />
                Get My Free Beats
              </>
            )}
          </Button>
        </form>

        {/* Privacy note */}
        <p className="text-[10px] md:text-xs text-muted-foreground text-center mt-3 md:mt-4">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
};

export default FreeBeatForm;
