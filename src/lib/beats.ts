import { supabase } from "@/integrations/supabase/client";

export const LICENSE_TIERS = ["mp3_lease", "wav_lease", "trackout", "unlimited", "exclusive"] as const;
export type LicenseTier = (typeof LICENSE_TIERS)[number];

export const TIER_LABELS: Record<LicenseTier, string> = {
  mp3_lease: "MP3 Lease",
  wav_lease: "WAV Lease",
  trackout: "Trackout (Stems)",
  unlimited: "Unlimited",
  exclusive: "Exclusive",
};

export interface LicenseDefault {
  price_cents: number;
  terms_summary: string;
  active: boolean;
}

export const FALLBACK_LICENSE_DEFAULTS: Record<LicenseTier, LicenseDefault> = {
  mp3_lease: { price_cents: 2999, terms_summary: "Untagged MP3, limited streams", active: true },
  wav_lease: { price_cents: 4999, terms_summary: "Untagged WAV + MP3, limited streams", active: true },
  trackout: { price_cents: 9999, terms_summary: "WAV, MP3 + stems", active: true },
  unlimited: { price_cents: 19999, terms_summary: "Unlimited streams & sales, all files", active: true },
  exclusive: { price_cents: 49999, terms_summary: "Full exclusive rights, beat removed from store", active: true },
};

export const LICENSE_DEFAULTS_KEY = "beat_license_defaults";

export async function fetchLicenseDefaults(): Promise<Record<LicenseTier, LicenseDefault>> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", LICENSE_DEFAULTS_KEY).maybeSingle();
  if (!data?.value) return FALLBACK_LICENSE_DEFAULTS;
  try {
    return { ...FALLBACK_LICENSE_DEFAULTS, ...JSON.parse(data.value) };
  } catch {
    return FALLBACK_LICENSE_DEFAULTS;
  }
}

/** Public buckets used for streamable previews and covers (public buckets are blocked for new ones). */
export const PREVIEW_AUDIO_BUCKET = "free-beats-audio";
export const COVER_BUCKET = "free-beats-covers";
export const DELIVERABLES_BUCKET = "beat-deliverables";

const safeName = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "_");

/** Uploads a file to storage with progress reporting. Returns storage path. */
export async function uploadWithProgress(
  bucket: string,
  folder: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");
  const path = `${folder}/${Date.now()}-${safeName(file.name)}`;
  const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader("x-upsert", "true");
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(file);
  });
  onProgress(100);
  return path;
}

export const publicUrl = (bucket: string, path: string) =>
  supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
