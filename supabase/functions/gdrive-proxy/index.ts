import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_drive/drive/v3';

function gwHeaders() {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GOOGLE_DRIVE_API_KEY = Deno.env.get('GOOGLE_DRIVE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
  if (!GOOGLE_DRIVE_API_KEY) throw new Error('GOOGLE_DRIVE_API_KEY is not configured');
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    'X-Connection-Api-Key': GOOGLE_DRIVE_API_KEY,
  };
}

// Google Workspace (Docs Editors) files cannot be downloaded with alt=media.
// They must be exported to a binary format.
const GOOGLE_APPS_EXPORT_MAP: Record<string, { mimeType: string; ext: string }> = {
  'application/vnd.google-apps.document': {
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: '.docx',
  },
  'application/vnd.google-apps.spreadsheet': {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: '.xlsx',
  },
  'application/vnd.google-apps.presentation': {
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ext: '.pptx',
  },
  'application/vnd.google-apps.drawing': {
    mimeType: 'image/png',
    ext: '.png',
  },
  'application/vnd.google-apps.script': {
    mimeType: 'application/vnd.google-apps.script+json',
    ext: '.json',
  },
  'application/vnd.google-apps.form': {
    mimeType: 'application/zip',
    ext: '.zip',
  },
  'application/vnd.google-apps.sites': {
    mimeType: 'application/zip',
    ext: '.zip',
  },
};

function isGoogleAppsFile(mimeType: string) {
  return mimeType.startsWith('application/vnd.google-apps.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    if (action === 'list') {
      const folderId = url.searchParams.get('folderId') || 'root';
      const kind = url.searchParams.get('kind') || 'all'; // audio | image | folder | all
      const search = url.searchParams.get('q') || '';

      const clauses: string[] = [`'${folderId.replace(/'/g, "\\'")}' in parents`, 'trashed = false'];
      if (kind === 'audio') {
        clauses.push("(mimeType contains 'audio/' or name contains '.mp3' or name contains '.wav')");
      } else if (kind === 'image') {
        clauses.push("mimeType contains 'image/'");
      } else if (kind === 'video') {
        clauses.push("(mimeType contains 'video/' or name contains '.mp4' or name contains '.mov' or name contains '.webm')");
      } else if (kind === 'folder') {
        clauses.push("mimeType = 'application/vnd.google-apps.folder'");
      }
      if (search) {
        const safe = search.replace(/'/g, "\\'");
        clauses.push(`name contains '${safe}'`);
      }
      const q = clauses.join(' and ');

      const params = new URLSearchParams({
        q,
        fields: 'files(id,name,mimeType,size,thumbnailLink,iconLink,modifiedTime),nextPageToken',
        pageSize: '200',
        orderBy: 'name',
        spaces: 'drive',
      });
      const r = await fetch(`${GATEWAY_URL}/files?${params}`, { headers: gwHeaders() });
      const data = await r.json();
      if (!r.ok) throw new Error(`Drive list failed [${r.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'download') {
      const fileId = url.searchParams.get('fileId');
      if (!fileId) throw new Error('fileId required');
      // Get metadata for name + mimeType
      const metaR = await fetch(`${GATEWAY_URL}/files/${fileId}?fields=id,name,mimeType,size`, {
        headers: gwHeaders(),
      });
      const meta = await metaR.json();
      if (!metaR.ok) throw new Error(`Drive meta failed [${metaR.status}]: ${JSON.stringify(meta)}`);

      let bytes: Uint8Array;
      let finalMimeType = meta.mimeType || 'application/octet-stream';
      let finalName = meta.name || fileId;

      if (isGoogleAppsFile(finalMimeType)) {
        const exportInfo = GOOGLE_APPS_EXPORT_MAP[finalMimeType];
        if (!exportInfo) {
          throw new Error(
            `Google Workspace file type '${finalMimeType}' cannot be downloaded directly. Please export it manually or choose a binary file.`
          );
        }
        const exportUrl = `${GATEWAY_URL}/files/${fileId}/export?mimeType=${encodeURIComponent(
          exportInfo.mimeType
        )}`;
        const exportRes = await fetch(exportUrl, { headers: gwHeaders() });
        if (!exportRes.ok) {
          const t = await exportRes.text();
          throw new Error(`Drive export failed [${exportRes.status}]: ${t}`);
        }
        bytes = new Uint8Array(await exportRes.arrayBuffer());
        finalMimeType = exportInfo.mimeType;
        finalName = finalName.endsWith(exportInfo.ext) ? finalName : `${finalName}${exportInfo.ext}`;
      } else {
        const dl = await fetch(`${GATEWAY_URL}/files/${fileId}?alt=media`, { headers: gwHeaders() });
        if (!dl.ok) {
          const t = await dl.text();
          throw new Error(`Drive download failed [${dl.status}]: ${t}`);
        }
        bytes = new Uint8Array(await dl.arrayBuffer());
      }

      return new Response(bytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': finalMimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(finalName)}"`,
          'X-File-Name': encodeURIComponent(finalName),
          'X-File-Mime': finalMimeType,
        },
      });
    }

    if (action === 'thumb') {
      // Proxy a thumbnail image bytes from Drive (gateway-authenticated)
      const fileId = url.searchParams.get('fileId');
      if (!fileId) throw new Error('fileId required');
      const dl = await fetch(`${GATEWAY_URL}/files/${fileId}?alt=media`, { headers: gwHeaders() });
      if (!dl.ok) throw new Error(`Drive thumb failed [${dl.status}]`);
      const bytes = new Uint8Array(await dl.arrayBuffer());
      return new Response(bytes, {
        headers: {
          ...corsHeaders,
          'Content-Type': dl.headers.get('Content-Type') || 'image/jpeg',
          'Cache-Control': 'private, max-age=300',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('gdrive-proxy error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});