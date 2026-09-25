import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

type ContentType = "banner" | "announcement" | "featured_playlist";
interface Item {
  id: string; type: ContentType; title: string; body: string | null; image_url: string | null;
  link: string | null; beat_id: string | null; starts_at: string | null; ends_at: string | null;
  active: boolean; sort_order: number;
}
const empty = { type: "banner" as ContentType, title: "", body: "", image_url: "", link: "", beat_id: "", starts_at: "", ends_at: "", active: true, sort_order: "0" };
const toLocal = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 16) : "");
const db = supabase as any;

export default function AdminAppContent() {
  const [items, setItems] = useState<Item[]>([]);
  const [beats, setBeats] = useState<{ id: string; title: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const load = async () => {
    const { data, error } = await db.from("app_content").select("*").order("sort_order");
    if (error) toast.error(error.message); else setItems(data || []);
  };
  useEffect(() => {
    load();
    supabase.from("beats").select("id,title").order("title").then(({ data }) => setBeats(data || []));
  }, []);

  const edit = (i?: Item) => {
    setEditId(i?.id ?? null);
    setForm(i ? { type: i.type, title: i.title, body: i.body ?? "", image_url: i.image_url ?? "", link: i.link ?? "", beat_id: i.beat_id ?? "", starts_at: toLocal(i.starts_at), ends_at: toLocal(i.ends_at), active: i.active, sort_order: String(i.sort_order) } : empty);
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    const row = {
      type: form.type, title: form.title.trim(), body: form.body || null, image_url: form.image_url || null,
      link: form.link || null, beat_id: form.beat_id || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      active: form.active, sort_order: parseInt(form.sort_order) || 0,
    };
    const { error } = editId ? await db.from("app_content").update(row).eq("id", editId) : await db.from("app_content").insert(row);
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await db.from("app_content").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const live = (i: Item) => i.active && (!i.starts_at || new Date(i.starts_at) <= new Date()) && (!i.ends_at || new Date(i.ends_at) > new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">App Content</h1>
          <p className="text-muted-foreground text-sm">Banners, announcements and playlists shown on the mobile app home screen.</p>
        </div>
        <Button onClick={() => edit()}><Plus className="h-4 w-4 mr-2" />New item</Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-muted-foreground">Nothing posted yet.</p>}
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            {i.image_url && <img src={i.image_url} alt="" className="h-14 w-14 rounded object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{i.title}</span>
                <Badge variant="outline">{i.type.replace("_", " ")}</Badge>
                <Badge variant={live(i) ? "default" : "secondary"}>{live(i) ? "Live" : "Not live"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Order {i.sort_order}{i.starts_at && ` · from ${new Date(i.starts_at).toLocaleString()}`}{i.ends_at && ` · until ${new Date(i.ends_at).toLocaleString()}`}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => edit(i)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => remove(i.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit item" : "New item"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ContentType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="featured_playlist">Featured playlist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
            <div><Label>Link</Label><Input value={form.link} placeholder="https://... or /beats/slug" onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
            <div><Label>Linked beat (optional)</Label>
              <Select value={form.beat_id || "none"} onValueChange={(v) => setForm({ ...form, beat_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {beats.map((b) => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Starts</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><Label>Ends</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <div className="flex items-center gap-2 pb-2"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Active</Label></div>
            </div>
            <Button className="w-full" onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
