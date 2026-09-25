import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TIER_LABELS, type LicenseTier } from "@/lib/beats";

interface BeatOrder {
  id: string;
  amount: number;
  created_at: string;
  license_tier: string | null;
  beats: { title: string; cover_image_url: string | null } | null;
}

export const BeatPurchases = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BeatOrder[]>([]);
  const [files, setFiles] = useState<Record<string, { file_name: string; file_path: string }[]>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("id, amount, created_at, license_tier, beats(title, cover_image_url)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .not("beat_id", "is", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as unknown as BeatOrder[]) || []));
  }, [user]);

  const getLinks = async (id: string) => {
    setBusy(id);
    const { data, error } = await supabase.functions.invoke("beat-download", { body: { orderId: id } });
    setBusy(null);
    if (error || data?.error) return toast.error("Could not get download links");
    setFiles((f) => ({ ...f, [id]: data.files || [] }));
  };

  if (!orders.length) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>My Beat Licenses</CardTitle>
        <CardDescription>Download the files included with each license.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {o.beats?.cover_image_url && <img src={o.beats.cover_image_url} alt="" className="h-12 w-12 rounded object-cover" />}
                <div>
                  <div className="font-semibold text-foreground">{o.beats?.title ?? "Beat"}</div>
                  <div className="text-sm text-muted-foreground">
                    {TIER_LABELS[o.license_tier as LicenseTier] ?? o.license_tier} · ${Number(o.amount).toFixed(2)}
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={() => getLinks(o.id)} disabled={busy === o.id}>
                {busy === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                Get files
              </Button>
            </div>
            {files[o.id] && (
              files[o.id].length ? (
                <div className="space-y-2">
                  {files[o.id].map((f) => (
                    <Button key={f.file_path} variant="outline" className="w-full justify-between" asChild>
                      <a href={f.file_path} target="_blank" rel="noopener noreferrer">
                        <span className="truncate">{f.file_name}</span>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Files are being prepared — please contact support.</p>
              )
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
