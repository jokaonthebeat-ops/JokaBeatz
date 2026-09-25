import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddLeadDialogProps {
  type: "free-beat" | "newsletter";
  onLeadAdded: () => void;
}

const genres = [
  "Hip Hop",
  "Trap",
  "R&B",
  "Pop",
  "Drill",
  "Afrobeats",
  "Lo-Fi",
  "Other",
];

export const AddLeadDialog = ({ type, onLeadAdded }: AddLeadDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    genre: "",
    source_page: "manual",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (type === "free-beat") {
        const { error } = await supabase.from("free_beat_requests").insert({
          name: formData.name.trim() || "Manual Entry",
          email: formData.email.trim(),
          genre: formData.genre || null,
        });
        if (error) throw error;

        // Auto-enroll in Free Beats sequence
        try {
          await supabase.functions.invoke("auto-enroll-sequence", {
            body: { email: formData.email.trim(), sequence_type: "free_beats" },
          });
        } catch (enrollError) {
          console.error("Failed to auto-enroll in sequence:", enrollError);
        }
      } else {
        const { error } = await supabase.from("leads").insert({
          name: formData.name.trim() || null,
          email: formData.email.trim(),
          source_page: formData.source_page || "manual",
        });
        if (error) throw error;

        // Auto-enroll in Newsletter sequence
        try {
          await supabase.functions.invoke("auto-enroll-sequence", {
            body: { email: formData.email.trim(), sequence_type: "newsletter" },
          });
        } catch (enrollError) {
          console.error("Failed to auto-enroll in sequence:", enrollError);
        }
      }

      toast({
        title: "Lead added",
        description: "The lead has been added successfully.",
      });

      setFormData({ name: "", email: "", genre: "", source_page: "manual" });
      setOpen(false);
      onLeadAdded();
    } catch (error: any) {
      console.error("Error adding lead:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add lead.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add {type === "free-beat" ? "Free Beat Lead" : "Newsletter Subscriber"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter name (optional)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>
          {type === "free-beat" ? (
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => setFormData({ ...formData, genre: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select genre (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source_page}
                onChange={(e) => setFormData({ ...formData, source_page: e.target.value })}
                placeholder="e.g., manual, import, landing-page"
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
