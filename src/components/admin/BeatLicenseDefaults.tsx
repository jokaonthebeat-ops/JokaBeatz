import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  LICENSE_TIERS,
  TIER_LABELS,
  LICENSE_DEFAULTS_KEY,
  fetchLicenseDefaults,
  type LicenseDefault,
  type LicenseTier,
} from "@/lib/beats";

export const BeatLicenseDefaults = () => {
  const [defs, setDefs] = useState<Record<LicenseTier, LicenseDefault> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLicenseDefaults().then(setDefs);
  }, []);

  const save = async () => {
    if (!defs) return;
    setSaving(true);
    const value = JSON.stringify(defs);
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", LICENSE_DEFAULTS_KEY).maybeSingle();
    const { error } = existing
      ? await supabase.from("site_settings").update({ value }).eq("id", existing.id)
      : await supabase.from("site_settings").insert({ key: LICENSE_DEFAULTS_KEY, value });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Default license prices saved");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Default Beat License Prices</CardTitle>
        <CardDescription>Prefilled on every new beat. You can still change them per beat.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!defs ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {LICENSE_TIERS.map((t) => (
              <div key={t} className="grid grid-cols-1 md:grid-cols-[140px_120px_1fr_auto] gap-3 items-center">
                <Label className="font-semibold">{TIER_LABELS[t]}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(defs[t].price_cents / 100).toString()}
                  onChange={(e) =>
                    setDefs({ ...defs, [t]: { ...defs[t], price_cents: Math.round(Number(e.target.value || 0) * 100) } })
                  }
                />
                <Input
                  placeholder="Terms summary"
                  value={defs[t].terms_summary}
                  onChange={(e) => setDefs({ ...defs, [t]: { ...defs[t], terms_summary: e.target.value } })}
                />
                <Switch checked={defs[t].active} onCheckedChange={(v) => setDefs({ ...defs, [t]: { ...defs[t], active: v } })} />
              </div>
            ))}
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save defaults
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
