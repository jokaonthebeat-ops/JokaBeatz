import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone } from "lucide-react";
import { useState } from "react";

interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  content: string;
  onUseTemplate?: () => void;
}

const EmailPreviewModal = ({
  open,
  onOpenChange,
  subject,
  content,
  onUseTemplate,
}: EmailPreviewModalProps) => {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // Replace placeholders with example values for preview
  const processedContent = content
    .replace(/\{\{site_url\}\}/g, "https://jokabeatz.com")
    .replace(/\{\{name\}\}/g, "Artist Name")
    .replace(/\{\{email\}\}/g, "artist@example.com")
    .replace(/\{\{beat_details\}\}/g, "5 new trap beats, 3 R&B instrumentals, and 2 lo-fi vibes")
    .replace(/\{\{custom_subject\}\}/g, subject)
    .replace(/\{\{custom_content\}\}/g, "<p>Your custom message goes here...</p>");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Subject: </span>
            <span className="font-medium text-foreground">
              {subject.replace(/\{\{custom_subject\}\}/g, "Your Subject Here")}
            </span>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "desktop" | "mobile")}>
            <TabsList className="grid w-[160px] grid-cols-2">
              <TabsTrigger value="desktop" className="text-xs">
                <Monitor className="h-3 w-3 mr-1" />
                Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="text-xs">
                <Smartphone className="h-3 w-3 mr-1" />
                Mobile
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          <div
            className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
              viewMode === "mobile" ? "max-w-[375px]" : "max-w-[600px]"
            }`}
          >
            <iframe
              srcDoc={processedContent}
              className="w-full border-0"
              style={{ height: "500px" }}
              title="Email Preview"
            />
          </div>
        </div>

        {onUseTemplate && (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => {
                onUseTemplate();
                onOpenChange(false);
              }}
            >
              Use This Template
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewModal;
