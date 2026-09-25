import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Folder, Music, Image as ImageIcon, ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "audio" | "image" | "video";
  onSelect: (file: File) => void;
}

const FOLDER_MIME = "application/vnd.google-apps.folder";

export const GoogleDrivePicker = ({ open, onOpenChange, mode, onSelect }: Props) => {
  const storageKey = `gdrive_folder_${mode}`;
  const [folderId, setFolderId] = useState<string>("root");
  const [folderInput, setFolderInput] = useState<string>("");
  const [stack, setStack] = useState<{ id: string; name: string }[]>([{ id: "root", name: "My Drive" }]);
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Restore saved folder when opening
  useEffect(() => {
    if (!open) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFolderId(parsed.id);
        setStack(parsed.stack || [{ id: parsed.id, name: parsed.name || "Folder" }]);
      } catch {}
    }
  }, [open, storageKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const kindForFiles = mode === "audio" ? "audio" : mode === "video" ? "video" : "image";
      const qParam = search ? `&q=${encodeURIComponent(search)}` : "";

      const [foldersR, filesR] = await Promise.all([
        fetch(`${FUNCTIONS_BASE}/gdrive-proxy?action=list&kind=folder&folderId=${encodeURIComponent(folderId)}${qParam}`, { headers }),
        fetch(`${FUNCTIONS_BASE}/gdrive-proxy?action=list&kind=${kindForFiles}&folderId=${encodeURIComponent(folderId)}${qParam}`, { headers }),
      ]);
      const fd = await foldersR.json();
      const ff = await filesR.json();
      if (!foldersR.ok) throw new Error(fd.error || "Failed to list folders");
      if (!filesR.ok) throw new Error(ff.error || "Failed to list files");
      setFolders(fd.files || []);
      setFiles(ff.files || []);
    } catch (e: any) {
      toast.error(e.message || "Drive load failed");
    } finally {
      setLoading(false);
    }
  }, [folderId, mode, search]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const enterFolder = (f: DriveFile) => {
    const newStack = [...stack, { id: f.id, name: f.name }];
    setStack(newStack);
    setFolderId(f.id);
    localStorage.setItem(storageKey, JSON.stringify({ id: f.id, name: f.name, stack: newStack }));
  };

  const goBack = () => {
    if (stack.length <= 1) return;
    const newStack = stack.slice(0, -1);
    const top = newStack[newStack.length - 1];
    setStack(newStack);
    setFolderId(top.id);
    localStorage.setItem(storageKey, JSON.stringify({ id: top.id, name: top.name, stack: newStack }));
  };

  const jumpToFolder = () => {
    const id = folderInput.trim();
    if (!id) return;
    // Accept full URLs
    const m = id.match(/folders\/([a-zA-Z0-9_-]+)/);
    const realId = m ? m[1] : id;
    const newStack = [{ id: "root", name: "My Drive" }, { id: realId, name: "Folder" }];
    setStack(newStack);
    setFolderId(realId);
    setFolderInput("");
    localStorage.setItem(storageKey, JSON.stringify({ id: realId, name: "Folder", stack: newStack }));
  };

  const pickFile = async (f: DriveFile) => {
    setDownloading(f.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const r = await fetch(`${FUNCTIONS_BASE}/gdrive-proxy?action=download&fileId=${f.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Download failed: ${t}`);
      }
      const blob = await r.blob();
      const file = new File([blob], f.name, { type: f.mimeType || blob.type });
      onSelect(file);
      onOpenChange(false);
      toast.success(`Loaded ${f.name}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to fetch file");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "audio" ? <Music className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            Pick {mode === "audio" ? "MP3" : mode === "video" ? "background video" : "thumbnail"} from Google Drive
          </DialogTitle>
        </DialogHeader>

        {/* Breadcrumb + jump */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border pb-3">
          <Button type="button" variant="ghost" size="sm" onClick={goBack} disabled={stack.length <= 1}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 truncate">
            {stack.map((s, i) => (
              <span key={s.id + i}>
                {i > 0 && <span className="mx-1">/</span>}
                <span className={i === stack.length - 1 ? "text-foreground font-medium" : ""}>{s.name}</span>
              </span>
            ))}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="Search in current folder…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
            <Button type="button" variant="secondary" onClick={load}>Search</Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Paste Drive folder URL or ID to jump…"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && jumpToFolder()}
            />
            <Button type="button" variant="secondary" onClick={jumpToFolder} disabled={!folderInput.trim()}>Go</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
            </div>
          ) : (
            <div className="space-y-4">
              {folders.length > 0 && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground mb-2">Folders</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => enterFolder(f)}
                        className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary hover:bg-secondary/70 text-left text-sm"
                      >
                        <Folder className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs uppercase text-muted-foreground mb-2">
                  {mode === "audio" ? "Audio files" : mode === "video" ? "Videos" : "Images"} ({files.length})
                </p>
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No {mode === "audio" ? "audio files" : mode === "video" ? "videos" : "images"} in this folder.
                  </p>
                ) : mode === "image" || mode === "video" ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => pickFile(f)}
                        disabled={downloading !== null}
                        className="group relative aspect-square rounded-md overflow-hidden bg-secondary hover:ring-2 hover:ring-primary disabled:opacity-50"
                      >
                        {f.thumbnailLink ? (
                          <img src={f.thumbnailLink} alt={f.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {mode === "video" ? <Music className="w-8 h-8 text-muted-foreground" /> : <ImageIcon className="w-8 h-8 text-muted-foreground" />}
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] p-1 truncate">
                          {f.name}
                        </div>
                        {downloading === f.id && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {files.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => pickFile(f)}
                        disabled={downloading !== null}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-secondary hover:bg-secondary/70 text-left disabled:opacity-50"
                      >
                        <Music className="w-4 h-4 text-primary shrink-0" />
                        <span className="flex-1 truncate text-sm">{f.name}</span>
                        {f.size && (
                          <span className="text-xs text-muted-foreground">
                            {(parseInt(f.size) / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        )}
                        {downloading === f.id && <Loader2 className="w-4 h-4 animate-spin" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};