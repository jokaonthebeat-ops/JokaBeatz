// deno-lint-ignore-file no-explicit-any
export const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

export async function signBeatDeliverables(supabaseAdmin: any, beatId: string, tier: string) {
  const { data: license } = await supabaseAdmin
    .from("beat_licenses")
    .select("deliverable_paths")
    .eq("beat_id", beatId)
    .eq("tier", tier)
    .maybeSingle();

  const paths: string[] = license?.deliverable_paths || [];
  const files: { file_name: string; file_path: string }[] = [];
  for (const p of paths) {
    // External download link stored as "Label|https://..." (WAV / stems hosted elsewhere)
    const link = parseLink(p);
    if (link) {
      files.push({ file_name: link.label, file_path: link.url });
      continue;
    }
    const { data } = await supabaseAdmin.storage
      .from("beat-deliverables")
      .createSignedUrl(p, SIGNED_URL_TTL, { download: p.split("/").pop() });
    if (data?.signedUrl) {
      files.push({ file_name: p.split("/").pop()!.replace(/^\d+-/, ""), file_path: data.signedUrl });
    }
  }
  return files;
}

export function parseLink(entry: string): { label: string; url: string } | null {
  const i = entry.indexOf("|");
  const url = i >= 0 ? entry.slice(i + 1) : entry;
  if (!/^https:\/\//i.test(url)) return null;
  return { label: (i >= 0 ? entry.slice(0, i) : "") || "Download", url };
}
