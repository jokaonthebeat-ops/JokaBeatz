import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const EmailCapture = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("leads")
        .insert({ email: email.trim(), source_page: "newsletter" });

      if (error) throw error;

      // Auto-enroll in the Newsletter 90-day sequence
      try {
        await supabase.functions.invoke("auto-enroll-sequence", {
          body: { email: email.trim(), sequence_type: "newsletter" },
        });
      } catch (enrollError) {
        console.error("Failed to auto-enroll in sequence:", enrollError);
        // Don't fail the main request if enrollment fails
      }

      toast({
        title: "Success!",
        description: "You're now subscribed to our updates.",
      });
      setEmail("");
    } catch (error) {
      console.error("Error subscribing:", error);
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
    <section className="py-20 bg-card relative overflow-hidden">
      {/* Pulsing concentric circles */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="absolute w-[200px] h-[200px] border border-primary/20 rounded-full animate-ripple" />
        <div className="absolute w-[400px] h-[400px] border border-primary/15 rounded-full animate-ripple-delayed" />
        <div className="absolute w-[600px] h-[600px] border border-primary/10 rounded-full animate-ripple-slow" />
        <div className="absolute w-[800px] h-[800px] border border-primary/5 rounded-full animate-ripple" />
      </div>

      {/* Energy field glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse-glow" />
      </div>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-t from-card via-transparent to-card" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            Get updates, drops & free game
          </h2>
          <p className="text-muted-foreground mb-8">
            Join the list for exclusive content, new beat drops, and producer tips.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground h-12"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-8 red-glow red-glow-hover"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join the List"
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};
