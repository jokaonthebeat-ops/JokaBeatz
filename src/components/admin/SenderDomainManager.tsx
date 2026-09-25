import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  useSenderDomains, 
  useAddSenderDomain, 
  useDeleteSenderDomain, 
  useSetDefaultSenderDomain 
} from "@/hooks/useSenderDomains";
import { Loader2, Plus, Trash2, Star, Mail } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SenderDomainManager = () => {
  const { toast } = useToast();
  const { data: domains, isLoading } = useSenderDomains();
  const addDomain = useAddSenderDomain();
  const deleteDomain = useDeleteSenderDomain();
  const setDefault = useSetDefaultSenderDomain();

  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDomain = async () => {
    if (!newEmail.trim() || !newName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both email and name fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDomain.mutateAsync({ 
        email: newEmail.trim(), 
        name: newName.trim(),
        is_default: !domains || domains.length === 0 
      });
      toast({
        title: "Sender added",
        description: "The sender domain has been added successfully.",
      });
      setNewEmail("");
      setNewName("");
      setIsAdding(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add sender domain. Make sure the email is unique.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDomain.mutateAsync(id);
      toast({
        title: "Sender removed",
        description: "The sender domain has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove sender domain.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id);
      toast({
        title: "Default updated",
        description: "The default sender has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set default sender.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Sender Domains
        </CardTitle>
        <CardDescription>
          Manage verified sender email addresses for your campaigns. These must be verified in Resend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing domains list */}
        {domains && domains.length > 0 ? (
          <div className="space-y-2">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{domain.name}</span>
                      {domain.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{domain.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!domain.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(domain.id)}
                      disabled={setDefault.isPending}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete sender?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove "{domain.email}" from your sender list. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(domain.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No sender domains configured yet.</p>
          </div>
        )}

        {/* Add new domain form */}
        {isAdding ? (
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-name">Sender Name</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Joka Beatz"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-email">Sender Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g., hello@jokabeatz.com"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Make sure this email is verified in your Resend account at{" "}
              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                resend.com/domains
              </a>
            </p>
            <div className="flex gap-2">
              <Button onClick={handleAddDomain} disabled={addDomain.isPending}>
                {addDomain.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add Sender
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Sender Domain
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SenderDomainManager;
