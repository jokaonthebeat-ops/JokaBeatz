import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GripVertical, Loader2, Pencil, Plus, Star, Trash2, Upload, X, Music } from "lucide-react";
import {
  COVER_BUCKET,
  DELIVERABLES_BUCKET,
  LICENSE_TIERS,
  PREVIEW_AUDIO_BUCKET,
  TIER_LABELS,
  fetchLicenseDefaults,
  publicUrl,
  uploadWithProgress,
  type LicenseTier,
} from "@/lib/beats";

interface Beat {
  id: string;
  title: string;
  slug: string | null;
  bpm: number | null;
  musical_key: string | null;
  genre: string | null;
  mood: string | null;
  tags: string[];
  description: string | null;
  cover_image_url: string | null;
  preview_audio_path: string | null;
  status: "draft" | "published";
  featured: boolean;
  sort_order: number;
  plays_count: number;
}

interface LicenseForm {
  id?: string;
  price: string;
  stripe_price_id: string;
  deliverable_paths: string[];
  terms_summary: string;
  active: boolean;
}

type LicenseMap = Record<LicenseTier, LicenseForm>;

const emptyBeat = {
  title: "",
  slug: "",
  bpm: "",
  musical_key: "",
  genre: "",
  mood: "",
  tags: "",
  description: "",
  cover_image_url: "",
  preview_audio_path: "",
  featured: false,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);

const DropZone = ({
  label,
  accept,
  multiple,
  onFiles,
  progress,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  onFiles: (f: File[]) => void;
  progress?: number | null;
}) => {
  const [over, setOver] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length) onFiles(multiple ? files : [files[0]]);
      }}
      className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg p-4 cursor-pointer text-sm transition-colors ${
        over ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"
      }`}
    >
      <Upload className="h-5 w-5 text-muted-foreground" />
      <span className="text-muted-foreground text-center">{label}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
      {progress != null && <Progress value={progress} className="w-full h-1.5 mt-2" />}
    </label>
  );
};

const AdminBeats = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [sales, setSales] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dragId, setDragId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBeat);
  const [licenses, setLicenses] = useState<LicenseMap | null>(null);
  const [progress, setProgress] = useState<Record<string, number | null>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("beats").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setBeats((data as Beat[]) || []);
    const { data: orders } = await supabase.from("orders").select("beat_id").eq("status", "completed").not("beat_id", "is", null);
    const counts: Record<string, number> = {};
    (orders || []).forEach((o: { beat_id: string | null }) => {
      if (o.beat_id) counts[o.beat_id] = (counts[o.beat_id] || 0) + 1;
    });
    setSales(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const genres = useMemo(() => Array.from(new Set(beats.map((b) => b.genre).filter(Boolean))) as string[], [beats]);

  const filtered = beats.filter(
    (b) =>
      (genreFilter === "all" || b.genre === genreFilter) &&
      (statusFilter === "all" || b.status === statusFilter) &&
      (!search || `${b.title} ${b.tags?.join(" ")} ${b.mood ?? ""}`.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = async () => {
    const defs = await fetchLicenseDefaults();
    const map = {} as LicenseMap;
    LICENSE_TIERS.forEach((t) => {
      map[t] = {
        price: (defs[t].price_cents / 100).toFixed(2),
        stripe_price_id: "",
        deliverable_paths: [],
        terms_summary: defs[t].terms_summary,
        active: defs[t].active,
      };
    });
    setEditingId(null);
    setForm(emptyBeat);
    setLicenses(map);
    setProgress({});
    setOpen(true);
  };

  const openEdit = async (b: Beat) => {
    const defs = await fetchLicenseDefaults();
    const { data } = await supabase.from("beat_licenses").select("*").eq("beat_id", b.id);
    const ids = (data || []).map((x) => x.id);
    const { data: delivRows } = ids.length
      ? await supabase.from("beat_license_deliverables").select("license_id, paths").in("license_id", ids)
      : { data: [] as { license_id: string; paths: string[] }[] };
    const delivMap = new Map((delivRows || []).map((d) => [d.license_id, d.paths || []]));
    const map = {} as LicenseMap;
    LICENSE_TIERS.forEach((t) => {
      const l = data?.find((x) => x.tier === t);
      map[t] = l
        ? {
            id: l.id,
            price: (l.price_cents / 100).toFixed(2),
            stripe_price_id: l.stripe_price_id || "",
            deliverable_paths: delivMap.get(l.id) || [],
            terms_summary: l.terms_summary || "",
            active: l.active,
          }
        : { price: (defs[t].price_cents / 100).toFixed(2), stripe_price_id: "", deliverable_paths: [], terms_summary: defs[t].terms_summary, active: false };
    });
    setEditingId(b.id);
    setForm({
      title: b.title,
      slug: b.slug || "",
      bpm: b.bpm?.toString() || "",
      musical_key: b.musical_key || "",
      genre: b.genre || "",
      mood: b.mood || "",
      tags: (b.tags || []).join(", "),
      description: b.description || "",
      cover_image_url: b.cover_image_url || "",
      preview_audio_path: b.preview_audio_path || "",
      featured: b.featured,
    });
    setLicenses(map);
    setProgress({});
    setOpen(true);
  };

  const doUpload = async (key: string, bucket: string, folder: string, file: File) => {
    setProgress((p) => ({ ...p, [key]: 0 }));
    try {
      const path = await uploadWithProgress(bucket, folder, file, (pct) => setProgress((p) => ({ ...p, [key]: pct })));
      return path;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
      return null;
    } finally {
      setTimeout(() => setProgress((p) => ({ ...p, [key]: null })), 800);
    }
  };

  const folderSlug = () => slugify(form.title) || "untitled";

  const save = async (status: "draft" | "published") => {
    if (!form.title.trim()) return toast.error("Title is required");
    const slug = form.slug.trim();
    if (slug) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return toast.error("Slug: use lowercase letters, numbers and single dashes only");
      let q = supabase.from("beats").select("id").eq("slug", slug);
      if (editingId) q = q.neq("id", editingId);
      const { data: taken } = await q.limit(1);
      if (taken && taken.length) return toast.error("That slug is already used by another beat");
    }
    if (status === "published" && !form.preview_audio_path) return toast.error("Add a tagged preview MP3 before publishing");
    if (!licenses) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        ...(slug ? { slug } : {}),
        bpm: form.bpm ? parseInt(form.bpm) : null,
        musical_key: form.musical_key || null,
        genre: form.genre || null,
        mood: form.mood || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        description: form.description || null,
        cover_image_url: form.cover_image_url || null,
        preview_audio_path: form.preview_audio_path || null,
        featured: form.featured,
        status,
      };
      let beatId = editingId;
      if (editingId) {
        const { error } = await supabase.from("beats").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const minOrder = beats.length ? Math.min(...beats.map((b) => b.sort_order)) - 1 : 0;
        const { data, error } = await supabase.from("beats").insert({ ...payload, sort_order: minOrder }).select("id").single();
        if (error) throw error;
        beatId = data.id;
      }
      const rows = LICENSE_TIERS.map((t) => ({
        beat_id: beatId!,
        tier: t,
        price_cents: Math.round(Number(licenses[t].price || 0) * 100),
        stripe_price_id: licenses[t].stripe_price_id.trim() || null,
        terms_summary: licenses[t].terms_summary || null,
        active: licenses[t].active,
      }));
      const { data: saved, error: lErr } = await supabase
        .from("beat_licenses")
        .upsert(rows, { onConflict: "beat_id,tier" })
        .select("id, tier");
      if (lErr) throw lErr;
      const delivRows = (saved || []).map((s) => ({
        license_id: s.id,
        paths: licenses[s.tier as LicenseTier].deliverable_paths,
      }));
      if (delivRows.length) {
        const { error: dErr } = await supabase.from("beat_license_deliverables").upsert(delivRows, { onConflict: "license_id" });
        if (dErr) throw dErr;
      }
      toast.success(status === "published" ? "Beat published" : "Draft saved");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b: Beat) => {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    const { data: lic } = await supabase.from("beat_licenses").select("id").eq("beat_id", b.id);
    const licIds = (lic || []).map((l) => l.id);
    const { data: delivs } = licIds.length
      ? await supabase.from("beat_license_deliverables").select("paths").in("license_id", licIds)
      : { data: [] as { paths: string[] }[] };
    const paths = (delivs || []).flatMap((d) => d.paths || []).filter((p) => !isLinkEntry(p));
    const { error } = await supabase.from("beats").delete().eq("id", b.id);
    if (error) return toast.error(error.message);
    if (paths.length) await supabase.storage.from(DELIVERABLES_BUCKET).remove(paths);
    toast.success("Beat deleted");
    load();
  };

  const toggleFeatured = async (b: Beat) => {
    setBeats((prev) => prev.map((x) => (x.id === b.id ? { ...x, featured: !x.featured } : x)));
    const { error } = await supabase.from("beats").update({ featured: !b.featured }).eq("id", b.id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const onDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const list = [...beats];
    const from = list.findIndex((b) => b.id === dragId);
    const to = list.findIndex((b) => b.id === targetId);
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    const reordered = list.map((b, i) => ({ ...b, sort_order: i }));
    setBeats(reordered);
    setDragId(null);
    const results = await Promise.all(
      reordered.map((b) => supabase.from("beats").update({ sort_order: b.sort_order }).eq("id", b.id))
    );
    if (results.some((r) => r.error)) toast.error("Could not save new order");
  };

  const canDrag = genreFilter === "all" && statusFilter === "all" && !search;
  const setLic = (t: LicenseTier, patch: Partial<LicenseForm>) =>
    setLicenses((l) => (l ? { ...l, [t]: { ...l[t], ...patch } } : l));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beats</h1>
          <p className="text-muted-foreground text-sm">Upload beats, set license tiers and deliverables.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Upload beat
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <Input placeholder="Search title, tags, mood…" value={search} onChange={(e) => setSearch(e.target.value)} className="md:max-w-xs" />
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder="Genre" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All genres</SelectItem>
            {genres.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-muted-foreground">
            <tr>
              <th className="w-8" />
              <th className="text-left p-3">Beat</th>
              <th className="text-left p-3">BPM</th>
              <th className="text-left p-3">Key</th>
              <th className="text-left p-3">Genre</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Plays</th>
              <th className="text-right p-3">Sales</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No beats yet.</td></tr>
            ) : (
              filtered.map((b) => (
                <tr
                  key={b.id}
                  draggable={canDrag}
                  onDragStart={() => setDragId(b.id)}
                  onDragOver={(e) => canDrag && e.preventDefault()}
                  onDrop={() => onDrop(b.id)}
                  className={`border-t border-border ${dragId === b.id ? "opacity-50" : ""}`}
                >
                  <td className="pl-2 text-muted-foreground">
                    {canDrag && <GripVertical className="h-4 w-4 cursor-grab" />}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {b.cover_image_url ? (
                        <img src={b.cover_image_url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center"><Music className="h-4 w-4" /></div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{b.title}</div>
                        <div className="text-xs text-muted-foreground">/{b.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{b.bpm ?? "—"}</td>
                  <td className="p-3">{b.musical_key ?? "—"}</td>
                  <td className="p-3">{b.genre ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant={b.status === "published" ? "default" : "secondary"}>{b.status}</Badge>
                  </td>
                  <td className="p-3 text-right">{b.plays_count}</td>
                  <td className="p-3 text-right">{sales[b.id] || 0}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => toggleFeatured(b)} aria-label="Toggle featured">
                        <Star className={`h-4 w-4 ${b.featured ? "fill-primary text-primary" : ""}`} />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(b)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!canDrag && <p className="text-xs text-muted-foreground">Clear search and filters to drag-reorder.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit beat" : "Upload beat"}</DialogTitle></DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Slug (optional)</Label>
              <Input
                placeholder={editingId ? "Leave as is to keep current slug" : slugify(form.title) || "auto-generated"}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              />
              <p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers and dashes. Leave blank to auto-generate. Never changes when you edit the title.</p>
            </div>
            <div><Label>BPM</Label><Input type="number" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: e.target.value })} /></div>
            <div><Label>Key</Label><Input placeholder="F# minor" value={form.musical_key} onChange={(e) => setForm({ ...form, musical_key: e.target.value })} /></div>
            <div><Label>Genre</Label><Input value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} /></div>
            <div><Label>Mood</Label><Input value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

            <div>
              <Label>Tagged preview MP3</Label>
              <DropZone
                label="Drop MP3 or click"
                accept="audio/mpeg,audio/mp3,.mp3"
                progress={progress.preview}
                onFiles={async ([f]) => {
                  const p = await doUpload("preview", PREVIEW_AUDIO_BUCKET, `beats/${folderSlug()}`, f);
                  if (p) setForm((s) => ({ ...s, preview_audio_path: publicUrl(PREVIEW_AUDIO_BUCKET, p) }));
                }}
              />
              {form.preview_audio_path && <audio controls src={form.preview_audio_path} className="w-full mt-2 h-9" />}
            </div>
            <div>
              <Label>Cover art</Label>
              <DropZone
                label="Drop image or click"
                accept="image/*"
                progress={progress.cover}
                onFiles={async ([f]) => {
                  const p = await doUpload("cover", COVER_BUCKET, `beats/${folderSlug()}`, f);
                  if (p) setForm((s) => ({ ...s, cover_image_url: publicUrl(COVER_BUCKET, p) }));
                }}
              />
              {form.cover_image_url && <img src={form.cover_image_url} alt="" className="h-20 w-20 rounded object-cover mt-2" />}
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label>Featured</Label>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <h3 className="font-bold text-foreground">License tiers</h3>
            {licenses &&
              LICENSE_TIERS.map((t) => (
                <div key={t} className="border border-border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{TIER_LABELS[t]}</span>
                    <div className="flex items-center gap-2 text-sm">
                      Active <Switch checked={licenses[t].active} onCheckedChange={(v) => setLic(t, { active: v })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div><Label className="text-xs">Price (USD)</Label><Input type="number" step="0.01" value={licenses[t].price} onChange={(e) => setLic(t, { price: e.target.value })} /></div>
                    <div><Label className="text-xs">Stripe price ID (optional)</Label><Input placeholder="price_…" value={licenses[t].stripe_price_id} onChange={(e) => setLic(t, { stripe_price_id: e.target.value })} /></div>
                    <div><Label className="text-xs">Terms summary</Label><Input value={licenses[t].terms_summary} onChange={(e) => setLic(t, { terms_summary: e.target.value })} /></div>
                  </div>
                  <DropZone
                    label="Drop untagged MP3 (hosted here)"
                    accept="audio/mpeg,.mp3"
                    multiple
                    progress={progress[t]}
                    onFiles={async (files) => {
                      for (const f of files) {
                        if (!/\.mp3$/i.test(f.name)) { toast.error(`${f.name}: only MP3 files are hosted — add WAV/stems as a download link`); continue; }
                        const p = await doUpload(t, DELIVERABLES_BUCKET, `${folderSlug()}/${t}`, f);
                        if (p) setLicenses((l) => (l ? { ...l, [t]: { ...l[t], deliverable_paths: [...l[t].deliverable_paths, p] } } : l));
                      }
                    }}
                  />
                  <DeliveryLinkAdder onAdd={(label, url) => setLic(t, { deliverable_paths: [...licenses[t].deliverable_paths, `${label}|${url}`] })} />
                  {licenses[t].deliverable_paths.length > 0 && (
                    <ul className="text-xs space-y-1">
                      {licenses[t].deliverable_paths.map((p) => (
                        <li key={p} className="flex items-center justify-between bg-secondary rounded px-2 py-1">
                          <span className="truncate">{isLinkEntry(p) ? `Link: ${p.split("|")[0]}` : p.split("/").pop()?.replace(/^\d+-/, "")}</span>
                          <button
                            type="button"
                            onClick={() => setLic(t, { deliverable_paths: licenses[t].deliverable_paths.filter((x) => x !== p) })}
                            aria-label="Remove file"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" disabled={saving} onClick={() => save("draft")}>Save draft</Button>
            <Button disabled={saving} onClick={() => save("published")}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBeats;

const isLinkEntry = (p: string) => /\|?https:\/\//i.test(p);

function DeliveryLinkAdder({ onAdd }: { onAdd: (label: string, url: string) => void }) {
  const [label, setLabel] = useState("WAV");
  const [url, setUrl] = useState("");
  const add = () => {
    const u = url.trim();
    if (!/^https:\/\/\S+$/i.test(u)) return toast.error("Paste a full https:// download link");
    onAdd(label.trim().replace(/\|/g, "") || "Download", u);
    setUrl("");
  };
  return (
    <div className="space-y-1">
      <Label className="text-xs">WAV / stems download link (Google Drive, Dropbox…)</Label>
      <div className="flex gap-2">
        <Select value={label} onValueChange={setLabel}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="WAV">WAV</SelectItem>
            <SelectItem value="Stems">Stems</SelectItem>
            <SelectItem value="Download">Other</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button type="button" variant="secondary" onClick={add}>Add</Button>
      </div>
    </div>
  );
}
