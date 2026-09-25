import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Music, Play, Pause, ImageIcon, Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FreeBeat {
  id: string;
  title: string;
  bpm: number | null;
  genre: string | null;
  preview_url: string;
  download_url: string;
  image_url: string | null;
  active: boolean;
  display_order: number;
  created_at: string;
}

const genres = ["Trap", "Hip-Hop", "R&B", "Drill", "Pop", "Afrobeats", "Lo-Fi", "Other"];

const AdminFreeBeats = () => {
  const { toast } = useToast();
  const [beats, setBeats] = useState<FreeBeat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBeat, setEditingBeat] = useState<FreeBeat | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState("");
  const [genre, setGenre] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [active, setActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("0");

  useEffect(() => {
    fetchBeats();
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  const fetchBeats = async () => {
    try {
      const { data, error } = await supabase
        .from("free_beats")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBeats(data || []);
    } catch (error) {
      console.error("Error fetching beats:", error);
      toast({
        title: "Error",
        description: "Failed to load free beats.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setBpm("");
    setGenre("");
    setPreviewUrl("");
    setDownloadUrl("");
    setImageUrl("");
    setActive(true);
    setDisplayOrder("0");
    setEditingBeat(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processCoverUpload(file);
  };

  const processCoverUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file (JPG, PNG, etc.)", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB", variant: "destructive" });
      return;
    }

    setIsUploadingCover(true);
    try {
      const timestamp = Date.now();
      const ext = file.name.split(".").pop() || "jpg";
      const sanitizedTitle = (title || "cover").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 50);
      const fileName = `${sanitizedTitle}-${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("free-beats-covers").upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("free-beats-covers").getPublicUrl(fileName);
      setImageUrl(urlData.publicUrl);
      toast({ title: "Cover art uploaded!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: "Failed to upload cover art.", variant: "destructive" });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAudioUpload(file);
  };

  const processAudioUpload = async (file: File) => {
    if (!file.type.includes("audio/") && !file.name.endsWith(".mp3") && !file.name.endsWith(".wav")) {
      toast({ title: "Invalid file type", description: "Please upload an audio file (MP3, WAV)", variant: "destructive" });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an audio file smaller than 50MB", variant: "destructive" });
      return;
    }

    setIsUploadingAudio(true);
    try {
      const timestamp = Date.now();
      const ext = file.name.split(".").pop() || "mp3";
      const sanitizedTitle = (title || "beat").toLowerCase().replace(/[^a-z0-9]/g, "-").substring(0, 50);
      const fileName = `${sanitizedTitle}-${timestamp}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("free-beats-audio").upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("free-beats-audio").getPublicUrl(fileName);
      const audioUrl = urlData.publicUrl;
      
      // Set both preview and download to the same URL
      setPreviewUrl(audioUrl);
      setDownloadUrl(audioUrl);
      toast({ title: "Audio uploaded successfully!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: "Failed to upload audio.", variant: "destructive" });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    const file = e.dataTransfer.files[0];
    if (file) processAudioUpload(file);
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCover(false);
    const file = e.dataTransfer.files[0];
    if (file) processCoverUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const generateCoverArt = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a beat title before generating cover art.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover-art`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            genre: genre || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate cover art");
      }

      setImageUrl(data.imageUrl);
      toast({ title: "Cover art generated successfully!" });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate cover art.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const openEditDialog = (beat: FreeBeat) => {
    setEditingBeat(beat);
    setTitle(beat.title);
    setBpm(beat.bpm?.toString() || "");
    setGenre(beat.genre || "");
    setPreviewUrl(beat.preview_url);
    setDownloadUrl(beat.download_url);
    setImageUrl(beat.image_url || "");
    setActive(beat.active);
    setDisplayOrder(beat.display_order.toString());
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !previewUrl.trim()) {
      toast({
        title: "Missing fields",
        description: "Title and audio file are required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const beatData = {
        title: title.trim(),
        bpm: bpm ? parseInt(bpm) : null,
        genre: genre || null,
        preview_url: previewUrl.trim(),
        download_url: downloadUrl.trim(),
        image_url: imageUrl.trim() || null,
        active,
        display_order: parseInt(displayOrder) || 0,
      };

      if (editingBeat) {
        const { error } = await supabase
          .from("free_beats")
          .update(beatData)
          .eq("id", editingBeat.id);

        if (error) throw error;
        toast({ title: "Beat updated successfully" });
      } else {
        const { error } = await supabase.from("free_beats").insert([beatData]);

        if (error) throw error;
        toast({ title: "Beat added successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBeats();
    } catch (error) {
      console.error("Error saving beat:", error);
      toast({
        title: "Error",
        description: "Failed to save beat.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this beat?")) return;

    try {
      const { error } = await supabase.from("free_beats").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Beat deleted successfully" });
      fetchBeats();
    } catch (error) {
      console.error("Error deleting beat:", error);
      toast({
        title: "Error",
        description: "Failed to delete beat.",
        variant: "destructive",
      });
    }
  };

  const togglePlay = (beat: FreeBeat) => {
    if (playingId === beat.id) {
      audio?.pause();
      setPlayingId(null);
    } else {
      if (audio) {
        audio.pause();
      }
      const newAudio = new Audio(beat.preview_url);
      newAudio.play();
      newAudio.onended = () => setPlayingId(null);
      setAudio(newAudio);
      setPlayingId(beat.id);
    }
  };

  const toggleActive = async (beat: FreeBeat) => {
    try {
      const { error } = await supabase
        .from("free_beats")
        .update({ active: !beat.active })
        .eq("id", beat.id);

      if (error) throw error;
      fetchBeats();
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Free Beats Library</h1>
          <p className="text-muted-foreground">Manage beats available for free download</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Beat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingBeat ? "Edit Beat" : "Add New Beat"}</DialogTitle>
                <DialogDescription>
                  {editingBeat ? "Update the beat details below." : "Add a new beat to the free library."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Trap Soul Vibes"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bpm">BPM</Label>
                    <Input
                      id="bpm"
                      type="number"
                      value={bpm}
                      onChange={(e) => setBpm(e.target.value)}
                      placeholder="e.g., 140"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Audio File (MP3/WAV) *</Label>
                  <div
                    onDrop={handleAudioDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setIsDraggingAudio(true)}
                    onDragLeave={() => setIsDraggingAudio(false)}
                    onClick={() => audioInputRef.current?.click()}
                    className={`
                      border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
                      ${isDraggingAudio 
                        ? "border-primary bg-primary/10" 
                        : previewUrl 
                          ? "border-green-500/50 bg-green-500/5" 
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }
                    `}
                  >
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                    {isUploadingAudio ? (
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Uploading...</span>
                      </div>
                    ) : previewUrl ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Music className="h-5 w-5" />
                        <span className="text-sm font-medium">✓ Audio uploaded</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Drag & drop MP3/WAV or click to browse</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">This file will be used for both preview and download</p>
                </div>
                <div className="space-y-3">
                  <Label>Cover Art</Label>
                  <div className="flex gap-3">
                    <div
                      onDrop={handleCoverDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={() => setIsDraggingCover(true)}
                      onDragLeave={() => setIsDraggingCover(false)}
                      onClick={() => coverInputRef.current?.click()}
                      className={`
                        flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
                        ${isDraggingCover 
                          ? "border-primary bg-primary/10" 
                          : imageUrl 
                            ? "border-green-500/50 bg-green-500/5" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }
                      `}
                    >
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                      {isUploadingCover ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="text-sm">Uploading...</span>
                        </div>
                      ) : imageUrl ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <ImageIcon className="h-5 w-5" />
                          <span className="text-sm font-medium">✓ Cover uploaded</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <ImageIcon className="h-6 w-6" />
                          <span className="text-sm">Drag & drop image or click</span>
                        </div>
                      )}
                    </div>
                    {imageUrl && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border shrink-0">
                        <img
                          src={imageUrl}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateCoverArt}
                    disabled={isUploadingCover || isGenerating || !title.trim()}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    AI Generate Cover Art
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id="active"
                      checked={active}
                      onCheckedChange={setActive}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBeat ? "Update" : "Add"} Beat
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Total Beats: {beats.length}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {beats.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No beats yet</h3>
              <p className="text-muted-foreground">Add your first free beat to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="w-16">Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>BPM</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {beats.map((beat) => (
                  <TableRow key={beat.id}>
                    <TableCell>
                      <button
                        onClick={() => togglePlay(beat)}
                        className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                      >
                        {playingId === beat.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      {beat.image_url ? (
                        <img
                          src={beat.image_url}
                          alt={beat.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{beat.title}</TableCell>
                    <TableCell>{beat.genre || "—"}</TableCell>
                    <TableCell>{beat.bpm || "—"}</TableCell>
                    <TableCell>{beat.display_order}</TableCell>
                    <TableCell>
                      <Switch
                        checked={beat.active}
                        onCheckedChange={() => toggleActive(beat)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(beat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(beat.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFreeBeats;
