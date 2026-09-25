import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePopup } from "@/contexts/PopupContext";
import { Loader2, Music, Sparkles, X } from "lucide-react";

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

const FreeBeatPopup = () => {
  const { isOpen, closePopup, markAsConverted } = usePopup();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [genre, setGenre] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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
      }

      setIsSuccess(true);
      markAsConverted();
      
      toast({
        title: "Success!",
        description: "Check your email for your free beats.",
      });

      // Auto-close after success
      setTimeout(() => {
        closePopup();
        setIsSuccess(false);
        setName("");
        setEmail("");
        setGenre("");
      }, 3000);
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closePopup();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-secondary via-background to-secondary border-2 border-primary/50 p-0 overflow-hidden">
        {/* Decorative header */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 p-6 relative">
          <button
            onClick={closePopup}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={20} className="text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wider">
              Exclusive Offer
            </span>
            <Sparkles size={20} className="text-primary" />
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-bold text-center text-foreground">
              Get 5 Free Beats 🎵
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-center text-muted-foreground mt-2">
            Drop your email and get instant access to premium beats
          </p>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Check Your Inbox! 📧</h3>
              <p className="text-muted-foreground">
                Your free beats are on their way.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="popup-name" className="text-foreground font-semibold">
                  Name
                </Label>
                <Input
                  id="popup-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-email" className="text-foreground font-semibold">
                  Email
                </Label>
                <Input
                  id="popup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="popup-genre" className="text-foreground font-semibold">
                  Favorite Genre <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Select value={genre} onValueChange={setGenre} disabled={isLoading}>
                  <SelectTrigger className="bg-background border-border text-foreground h-11">
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 text-base red-glow red-glow-hover"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Get My Free Beats 🔥"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FreeBeatPopup;
