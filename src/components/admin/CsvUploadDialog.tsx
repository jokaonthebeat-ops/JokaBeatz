import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CsvUploadDialogProps {
  type: "free-beat" | "newsletter";
  onUploadComplete: () => void;
}

interface ParsedLead {
  name: string;
  email: string;
  genre?: string;
  source_page?: string;
}

export const CsvUploadDialog = ({ type, onUploadComplete }: CsvUploadDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const parseCSV = (text: string): { leads: ParsedLead[]; errors: string[] } => {
    const lines = text.split("\n").filter((line) => line.trim());
    const errors: string[] = [];
    const leads: ParsedLead[] = [];

    if (lines.length === 0) {
      return { leads: [], errors: ["CSV file is empty"] };
    }

    // Get headers from first line
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
    const emailIndex = headers.findIndex((h) => h === "email" || h === "e-mail" || h === "email address");
    const nameIndex = headers.findIndex((h) => h === "name" || h === "full name" || h === "fullname");
    const genreIndex = headers.findIndex((h) => h === "genre");
    const sourceIndex = headers.findIndex((h) => h === "source" || h === "source_page");

    if (emailIndex === -1) {
      return { leads: [], errors: ["CSV must have an 'email' column"] };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const email = values[emailIndex]?.trim();

      if (!email || !email.includes("@")) {
        errors.push(`Row ${i + 1}: Invalid or missing email`);
        continue;
      }

      const lead: ParsedLead = {
        name: nameIndex !== -1 ? values[nameIndex]?.trim() || "" : "",
        email: email,
      };

      if (type === "free-beat" && genreIndex !== -1) {
        lead.genre = values[genreIndex]?.trim() || undefined;
      }

      if (type === "newsletter") {
        lead.source_page = sourceIndex !== -1 ? values[sourceIndex]?.trim() || "csv-import" : "csv-import";
      }

      leads.push(lead);
    }

    return { leads, errors };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setErrors([]);
    setParsedLeads([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { leads, errors } = parseCSV(text);
      setParsedLeads(leads);
      setErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (parsedLeads.length === 0) {
      toast({
        title: "No valid leads",
        description: "Please select a CSV file with valid leads.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      // Insert leads in batches of 50
      const batchSize = 50;
      for (let i = 0; i < parsedLeads.length; i += batchSize) {
        const batch = parsedLeads.slice(i, i + batchSize);

        if (type === "free-beat") {
          const { error } = await supabase.from("free_beat_requests").insert(
            batch.map((lead) => ({
              name: lead.name || "CSV Import",
              email: lead.email,
              genre: lead.genre || null,
            }))
          );
          if (error) {
            console.error("Batch error:", error);
            errorCount += batch.length;
          } else {
            successCount += batch.length;
          }
        } else {
          const { error } = await supabase.from("leads").insert(
            batch.map((lead) => ({
              name: lead.name || null,
              email: lead.email,
              source_page: lead.source_page || "csv-import",
            }))
          );
          if (error) {
            console.error("Batch error:", error);
            errorCount += batch.length;
          } else {
            successCount += batch.length;
          }
        }
      }

      toast({
        title: "Import complete",
        description: `Successfully imported ${successCount} leads.${errorCount > 0 ? ` ${errorCount} failed.` : ""}`,
      });

      setOpen(false);
      setFileName("");
      setParsedLeads([]);
      setErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onUploadComplete();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to import leads.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFileName("");
    setParsedLeads([]);
    setErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => (isOpen ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Required column: <code className="bg-muted px-1 rounded">email</code>
              <br />
              Optional columns: <code className="bg-muted px-1 rounded">name</code>
              {type === "free-beat" && (
                <>, <code className="bg-muted px-1 rounded">genre</code></>
              )}
              {type === "newsletter" && (
                <>, <code className="bg-muted px-1 rounded">source</code></>
              )}
            </p>
          </div>

          {fileName && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{fileName}</span>
            </div>
          )}

          {parsedLeads.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Found <strong>{parsedLeads.length}</strong> valid leads ready to import.
              </AlertDescription>
            </Alert>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-1">{errors.length} issues found:</p>
                <ul className="list-disc list-inside text-xs max-h-24 overflow-y-auto">
                  {errors.slice(0, 5).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {errors.length > 5 && <li>...and {errors.length - 5} more</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isLoading || parsedLeads.length === 0}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {parsedLeads.length > 0 ? `${parsedLeads.length} Leads` : "Leads"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
