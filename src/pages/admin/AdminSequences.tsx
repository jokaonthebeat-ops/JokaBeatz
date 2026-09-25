import { useState } from "react";
import { useEmailSequences, useCreateEmailSequence, useDeleteEmailSequence, useUpdateEmailSequence } from "@/hooks/useEmailSequences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Settings, PlayCircle, PauseCircle, Mail, MousePointerClick, EyeOff, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const triggerTypeLabels = {
  opened_not_clicked: { label: "Opened but didn't click", icon: Mail, color: "bg-amber-500" },
  not_opened: { label: "Didn't open", icon: EyeOff, color: "bg-red-500" },
  clicked: { label: "Clicked", icon: MousePointerClick, color: "bg-green-500" },
  all_recipients: { label: "All recipients", icon: Users, color: "bg-blue-500" },
};

export default function AdminSequences() {
  const { data: sequences, isLoading } = useEmailSequences();
  const createSequence = useCreateEmailSequence();
  const deleteSequence = useDeleteEmailSequence();
  const updateSequence = useUpdateEmailSequence();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
    trigger_type: "opened_not_clicked" as const,
  });

  const handleCreate = async () => {
    if (!newSequence.name.trim()) {
      toast.error("Please enter a sequence name");
      return;
    }

    try {
      await createSequence.mutateAsync({
        name: newSequence.name,
        description: newSequence.description || null,
        trigger_type: newSequence.trigger_type,
        is_active: false,
      });
      toast.success("Sequence created successfully");
      setIsCreateOpen(false);
      setNewSequence({ name: "", description: "", trigger_type: "opened_not_clicked" });
    } catch (error) {
      toast.error("Failed to create sequence");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await updateSequence.mutateAsync({ id, is_active: !currentState });
      toast.success(currentState ? "Sequence paused" : "Sequence activated");
    } catch (error) {
      toast.error("Failed to update sequence");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sequence?")) return;
    
    try {
      await deleteSequence.mutateAsync(id);
      toast.success("Sequence deleted");
    } catch (error) {
      toast.error("Failed to delete sequence");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Sequences</h1>
          <p className="text-muted-foreground">
            Automated follow-up emails based on recipient behavior
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sequence
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Email Sequence</DialogTitle>
              <DialogDescription>
                Set up an automated email sequence triggered by recipient behavior.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Re-engagement Sequence"
                  value={newSequence.name}
                  onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What this sequence does..."
                  value={newSequence.description}
                  onChange={(e) => setNewSequence({ ...newSequence, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger Type</Label>
                <Select
                  value={newSequence.trigger_type}
                  onValueChange={(value: typeof newSequence.trigger_type) =>
                    setNewSequence({ ...newSequence, trigger_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opened_not_clicked">Opened but didn't click</SelectItem>
                    <SelectItem value="not_opened">Didn't open</SelectItem>
                    <SelectItem value="clicked">Clicked</SelectItem>
                    <SelectItem value="all_recipients">All recipients</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createSequence.isPending}>
                Create Sequence
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sequences?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No sequences yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-2">
              Create your first automated email sequence to follow up with recipients based on their behavior.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sequences?.map((sequence) => {
            const trigger = triggerTypeLabels[sequence.trigger_type];
            const TriggerIcon = trigger.icon;

            return (
              <Card key={sequence.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{sequence.name}</CardTitle>
                      {sequence.description && (
                        <CardDescription className="line-clamp-2">
                          {sequence.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {sequence.is_active ? (
                        <PlayCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <PauseCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${trigger.color} text-white`}>
                      <TriggerIcon className="h-3 w-3 mr-1" />
                      {trigger.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={sequence.is_active}
                        onCheckedChange={() => handleToggleActive(sequence.id, sequence.is_active)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {sequence.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/admin/sequences/${sequence.id}`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(sequence.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
