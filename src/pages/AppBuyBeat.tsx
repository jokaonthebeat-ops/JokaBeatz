import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Check, Download, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { LICENSE_TIERS, PREVIEW_AUDIO_BUCKET, TIER_LABELS, publicUrl, type LicenseTier } from "@/lib/beats";

interface Beat { id: string; title: string; bpm: number | null; musical_key: string | null; genre: string | null; cover_image_url: string | null; preview_audio_path: string | null; }
interface License { tier: LicenseTier; price_cents: number; terms_summary: string | null; }
const APP_LINK = "jokabeatz://purchases";

export default function AppBuyBeat() {
  const { beatSlug = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = params.get("session_id");
  const [beat, setBeat] = useState<Beat | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LicenseTier | null>(null);
  const [paying, setPaying] = useState(false);
  const [files, setFiles] = useState<{ file_name: string; file_path: string }[] | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: b } = await supabase.from("beats")
        .select("id,title,bpm,musical_key,genre,cover_image_url,preview_audio_path")
        .eq("slug", beatSlug).eq("status", "published").maybeSingle();
      setBeat(b as Beat | null);
      if (b) {
        const { data: l } = await supabase.from("beat_licenses").select("tier,price_cents,terms_summary")
          .eq("beat_id", b.id).eq("active", true);
        const sorted = ((l || []) as License[]).sort((a, c) => LICENSE_TIERS.indexOf(a.tier) - LICENSE_TIERS.indexOf(c.tier));
        setLicenses(sorted);
        const want = params.get("tier") as LicenseTier | null;
        setSelected(sorted.find((x) => x.tier === want)?.tier ?? sorted[0]?.tier ?? null);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatSlug]);

  useEffect(() => {
    if (!sessionId) return;
    setVerifying(true);
    supabase.functions.invoke("verify-payment", { body: { sessionId } }).then(({ data, error }) => {
      if (error || !data?.success) toast.error("We couldn't confirm the payment yet. Check your purchases in the app.");
      else setFiles(data.productFiles || []);
      setVerifying(false);
    });
  }, [sessionId]);

  useEffect(() => { if (params.get("canceled")) toast("Checkout canceled — no charge made."); }, [params]);

  const audio = useMemo(() => (beat?.preview_audio_path ? publicUrl(PREVIEW_AUDIO_BUCKET, beat.preview_audio_path) : null), [beat]);
  const current = licenses.find((l) => l.tier === selected);

  const buy = async () => {
    if (!beat || !selected) return;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/app/buy/${beatSlug}?tier=${selected}`)}`);
      return;
    }
    setPaying(true);
    const { data, error } = await supabase.functions.invoke("create-payment", {
      body: { beatId: beat.id, licenseTier: selected, returnPath: `/app/buy/${beatSlug}` },
    });
    if (error || !data?.url) { setPaying(false); toast.error(data?.error || "Could not start checkout"); return; }
    window.location.href = data.url;
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-[100dvh] bg-background text-foreground flex justify-center">
      <Helmet><title>{beat ? `Buy ${beat.title} | Joka Beatz` : "Buy beat | Joka Beatz"}</title><meta name="robots" content="noindex" /></Helmet>
      <main className="w-full max-w-md px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">{children}</main>
    </div>
  );

  const backButton = (
    <Button asChild size="lg" variant="outline" className="w-full h-14 text-base">
      <a href={APP_LINK}><Smartphone className="h-5 w-5 mr-2" />Back to the Joka Beatz app</a>
    </Button>
  );

  if (loading) return shell(<div className="flex justify-center pt-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  if (!beat) return shell(<div className="pt-24 text-center space-y-6"><h1 className="text-2xl font-bold">Beat not found</h1>{backButton}</div>);

  if (sessionId) return shell(
    <div className="pt-8 space-y-6">
      {beat.cover_image_url && <img src={beat.cover_image_url} alt={beat.title} className="w-28 h-28 rounded-xl object-cover mx-auto" />}
      {verifying ? (
        <div className="text-center space-y-3 pt-6"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /><p>Confirming your purchase…</p></div>
      ) : (
        <>
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center"><Check className="h-6 w-6 text-primary" /></div>
            <h1 className="text-2xl font-extrabold">You got it!</h1>
            <p className="text-muted-foreground">{beat.title}{current && ` — ${TIER_LABELS[current.tier]}`}</p>
          </div>
          <div className="space-y-2">
            {files && files.length > 0 ? files.map((f) => (
              <a key={f.file_path} href={f.file_path} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 active:scale-[0.99] transition">
                <Download className="h-5 w-5 text-primary shrink-0" /><span className="truncate font-medium">{f.file_name}</span>
              </a>
            )) : <p className="text-sm text-muted-foreground text-center">Your files will appear in your purchases shortly. We also emailed you the links.</p>}
          </div>
          <p className="text-xs text-muted-foreground text-center">Download links expire in 7 days. You can always get fresh ones from your purchases.</p>
          <Button asChild size="lg" className="w-full h-14 text-base"><a href={APP_LINK}><Smartphone className="h-5 w-5 mr-2" />Back to the Joka Beatz app</a></Button>
        </>
      )}
    </div>
  );

  return shell(
    <div className="space-y-6 pb-28">
      <div className="pt-2">
        {beat.cover_image_url
          ? <img src={beat.cover_image_url} alt={beat.title} className="w-full aspect-square rounded-2xl object-cover" />
          : <div className="w-full aspect-square rounded-2xl bg-muted" />}
        <h1 className="mt-4 text-3xl font-extrabold leading-tight">{beat.title}</h1>
        <p className="text-sm text-muted-foreground">{[beat.genre, beat.bpm && `${beat.bpm} BPM`, beat.musical_key].filter(Boolean).join(" · ")}</p>
        {audio && <audio controls preload="none" src={audio} className="w-full mt-4" />}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Choose a license</h2>
        {licenses.length === 0 && <p className="text-muted-foreground">No licenses available for this beat right now.</p>}
        {licenses.map((l) => {
          const on = l.tier === selected;
          return (
            <button key={l.tier} type="button" onClick={() => setSelected(l.tier)} aria-pressed={on}
              className={`w-full text-left rounded-xl border-2 p-4 transition ${on ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">{TIER_LABELS[l.tier]}</span>
                <span className="font-extrabold text-lg">${(l.price_cents / 100).toFixed(2)}</span>
              </div>
              {l.terms_summary && <p className="text-sm text-muted-foreground mt-1">{l.terms_summary}</p>}
            </button>
          );
        })}
      </section>

      {backButton}

      {current && (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-md mx-auto">
            <Button size="lg" className="w-full h-14 text-base font-bold" onClick={buy} disabled={paying}>
              {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : `Buy ${TIER_LABELS[current.tier]} · $${(current.price_cents / 100).toFixed(2)}`}
            </Button>
            {!user && <p className="text-xs text-muted-foreground text-center mt-2">You'll sign in with your Joka Beatz account first.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
