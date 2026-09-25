import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID')!;
const CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

async function getAccessToken(admin: any, userId: string): Promise<string> {
  const { data: tok, error } = await admin.from('youtube_oauth_tokens').select('*').eq('user_id', userId).maybeSingle();
  if (error || !tok) throw new Error('Not connected to YouTube');
  if (new Date(tok.expires_at).getTime() > Date.now() + 30000) return tok.access_token;
  // refresh
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      refresh_token: tok.refresh_token, grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!r.ok) {
    const msg = j.error_description || j.error || 'Token refresh failed';
    // If refresh token is invalid/revoked, delete it so the client knows to reconnect.
    if (j.error === 'invalid_grant' || /revoked|expired/i.test(String(msg))) {
      await admin.from('youtube_oauth_tokens').delete().eq('user_id', userId);
      throw new Error('REAUTH_REQUIRED: YouTube connection expired. Please reconnect.');
    }
    throw new Error(msg);
  }
  const expiresAt = new Date(Date.now() + (j.expires_in - 60) * 1000).toISOString();
  await admin.from('youtube_oauth_tokens').update({ access_token: j.access_token, expires_at: expiresAt }).eq('user_id', userId);
  return j.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { title, description, tags, fileSize, mimeType, beat_name, genre, type_artist, bpm, music_key, privacyStatus, scheduledAt } = body;
    if (!title || !fileSize || !mimeType) return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const accessToken = await getAccessToken(admin, user.id);

    // YouTube requires privacyStatus=private when publishAt is set, and the time must be in the future.
    let publishAt: string | undefined;
    let effectivePrivacy = privacyStatus || 'public';
    if (scheduledAt) {
      const t = new Date(scheduledAt).getTime();
      if (!isFinite(t)) return new Response(JSON.stringify({ error: 'invalid scheduledAt' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (t <= Date.now() + 60000) return new Response(JSON.stringify({ error: 'scheduledAt must be at least 1 minute in the future' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      publishAt = new Date(t).toISOString();
      effectivePrivacy = 'private';
    }

    // Create resumable upload session
    const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': String(fileSize),
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify({
        snippet: {
          title: title.slice(0, 100),
          description: (description || '').slice(0, 5000),
          tags: (tags || []).slice(0, 30),
          categoryId: '10', // Music
        },
        status: {
          privacyStatus: effectivePrivacy,
          ...(publishAt ? { publishAt } : {}),
          selfDeclaredMadeForKids: false,
          embeddable: true,
        },
      }),
    });
    if (!initRes.ok) {
      const errTxt = await initRes.text();
      return new Response(JSON.stringify({ error: 'youtube_init_failed', detail: errTxt }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) return new Response(JSON.stringify({ error: 'no upload url' }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Log upload (pending)
    const { data: rec } = await admin.from('youtube_uploads').insert({
      user_id: user.id, beat_name: beat_name || title, genre, type_artist, bpm, music_key,
      title, description, tags, status: 'uploading',
    }).select('id').maybeSingle();

    return new Response(JSON.stringify({ uploadUrl, accessToken, recordId: rec?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});