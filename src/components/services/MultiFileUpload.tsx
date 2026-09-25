import { useState, useRef } from "react";
import { Upload, X, Music, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MultiFileUploadProps {
  onFilesUploaded: (urls: string[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string;
  label: string;
  description?: string;
  bucket?: string;
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
}

export const MultiFileUpload = ({
  onFilesUploaded,
  maxFiles = 5,
  maxSizeMB = 50,
  acceptedTypes = "audio/*,.zip,.wav,.mp3",
  label,
  description,
  bucket = "service-order-uploads",
}: MultiFileUploadProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - uploadedFiles.length;
    if (files.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more file(s)`);
      return;
    }

    setIsUploading(true);
    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        toast.error(`${file.name} exceeds the ${maxSizeMB}MB size limit`);
        continue;
      }

      try {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${timestamp}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        newFiles.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
        });
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (newFiles.length > 0) {
      const updated = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updated);
      onFilesUploaded(updated.map(f => f.url));
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updated);
    onFilesUploaded(updated.map(f => f.url));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Upload area */}
      <div
        onClick={() => !isUploading && uploadedFiles.length < maxFiles && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploadedFiles.length >= maxFiles || isUploading
            ? "border-muted cursor-not-allowed opacity-50"
            : "border-border hover:border-primary cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading || uploadedFiles.length >= maxFiles}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploadedFiles.length >= maxFiles
                ? `Maximum ${maxFiles} files reached`
                : `Click to upload (max ${maxFiles} files, ${maxSizeMB}MB each)`}
            </span>
          </div>
        )}
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
            >
              {file.name.endsWith(".zip") ? (
                <File size={20} className="text-primary shrink-0" />
              ) : (
                <Music size={20} className="text-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="shrink-0"
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
