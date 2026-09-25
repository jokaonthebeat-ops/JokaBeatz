import { useSenderDomains, SenderDomain } from "@/hooks/useSenderDomains";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";

interface SenderDomainSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const SenderDomainSelect = ({ value, onChange }: SenderDomainSelectProps) => {
  const { data: domains, isLoading } = useSenderDomains();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>From</Label>
        <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading senders...</span>
        </div>
      </div>
    );
  }

  if (!domains || domains.length === 0) {
    return (
      <div className="space-y-2">
        <Label>From</Label>
        <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted/50">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            No sender domains configured. Add one in Settings.
          </span>
        </div>
      </div>
    );
  }

  // Set default value if not set
  if (!value && domains.length > 0) {
    const defaultDomain = domains.find(d => d.is_default) || domains[0];
    onChange(defaultDomain.id);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="sender">From</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="sender">
          <SelectValue placeholder="Select sender" />
        </SelectTrigger>
        <SelectContent>
          {domains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{domain.name}</span>
                <span className="text-muted-foreground text-sm">
                  &lt;{domain.email}&gt;
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SenderDomainSelect;
