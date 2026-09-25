import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EyeOff, Eye, Play } from "lucide-react";

interface Rec {
  id: string; title: string; duration_ms: number | null; storage_path: string;
  is_public: boolean; is_hidden: boolean; created_at: string; user_id: string;
}
const db = supabase as any;
const fmt = (ms: number | null) => (ms ? `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}` : "—");

export default function AdminRecordings() {
  const [stats, setStats] = useState({ lyrics: 0, recordings: 0, public: 0, hidden: 0 });
  const [recs, setRecs] = useState<Rec[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const load = async () => {
    const count = async (q: any) => (await q).count ?? 0;
    const [lyrics, recordings, pub, hidden] = await Promise.all([
      count(db.from("lyrics").select("id", { count: "exact", head: true })),
      count(db.from("recordings").select("id", { count: "exact", head: true })),
      count(db.from("recordings").select("id", { count: "exact", head: true }).eq("is_public", true).eq("is_hidden", false)),
      count(db.from("recordings").select("id", { count: "exact", head: true }).eq("is_hidden", true)),
    ]);
    setStats({ lyrics, recordings, public: pub, hidden });
    const { data, error } = await db.from("recordings").select("id,title,duration_ms,storage_path,is_public,is_hidden,created_at,user_id")
      .eq("is_public", true).order("created_at", { ascending: false }).limit(100);
    if (error) toast.error(error.message); else setRecs(data || []);
  };
  useEffect(() => { load(); }, []);

  const play = async (r: Rec) => {
    const { data, error } = await supabase.storage.from("vocal-takes").createSignedUrl(r.storage_path, 3600);
    if (error || !data) return toast.error("Could not load audio");
    setUrls((u) => ({ ...u, [r.id]: data.signedUrl }));
  };

  const toggleHidden = async (r: Rec) => {
    const { error } = await db.from("recordings").update({ is_hidden: !r.is_hidden }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(r.is_hidden ? "Recording visible again" : "Recording hidden");
    load();
  };

  const cards = [["Lyrics sheets", stats.lyrics], ["Recordings", stats.recordings], ["Public", stats.public], ["Hidden", stats.hidden]];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recordings & Lyrics</h1>
        <p className="text-muted-foreground text-sm">Activity from the mobile app.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(([label, n]) => (
          <div key={label as string} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold">{n}</p>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-semibold">Public recordings</h2>
      <div className="space-y-3">
        {recs.length === 0 && <p className="text-muted-foreground">No public recordings yet.</p>}
        {recs.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold flex-1 min-w-0 truncate">{r.title}</span>
              <span className="text-xs text-muted-foreground">{fmt(r.duration_ms)} · {new Date(r.created_at).toLocaleDateString()}</span>
              {r.is_hidden && <Badge variant="secondary">Hidden</Badge>}
              {!urls[r.id] && <Button size="sm" variant="outline" onClick={() => play(r)}><Play className="h-4 w-4 mr-1" />Listen</Button>}
              <Button size="sm" variant={r.is_hidden ? "outline" : "destructive"} onClick={() => toggleHidden(r)}>
                {r.is_hidden ? <><Eye className="h-4 w-4 mr-1" />Unhide</> : <><EyeOff className="h-4 w-4 mr-1" />Hide</>}
              </Button>
            </div>
            {urls[r.id] && <audio controls autoPlay src={urls[r.id]} className="w-full" />}
          </div>
        ))}
      </div>
    </div>
  );
}
