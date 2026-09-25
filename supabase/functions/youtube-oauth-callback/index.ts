import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CLIENT_ID = Deno.env.get('YOUTUBE_CLIENT_ID')!;
const CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/youtube-oauth-callback`;

function html(msg: string, ok = true) {
  return new Response(
    `<!doctype html><html><body style="font-family:system-ui;background:#0A0A0A;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center"><div><h1 style="color:${ok ? '#22c55e' : '#DC2626'}">${ok ? '✓ Connected' : '✗ Failed'}</h1><p>${msg}</p><p style="opacity:.6">You can close this window.</p><script>setTimeout(()=>window.close(),2000)</script></div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    if (error) return html(`Google returned: ${error}`, false);
    if (!code || !state) return html('Missing code or state', false);

    const { user_id } = JSON.parse(atob(state));
    if (!user_id) return html('Invalid state', false);

    // Exchange code for tokens
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI, grant_type: 'authorization_code',
      }),
    });
    const tok = await tokRes.json();
    if (!tokRes.ok) return html(tok.error_description || 'Token exchange failed', false);

    // Fetch channel info
    const chRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    const ch = await chRes.json();
    const channel = ch.items?.[0];

    const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const expiresAt = new Date(Date.now() + (tok.expires_in - 60) * 1000).toISOString();
    await admin.from('youtube_oauth_tokens').upsert({
      user_id,
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: expiresAt,
      scope: tok.scope,
      channel_id: channel?.id ?? null,
      channel_title: channel?.snippet?.title ?? null,
    }, { onConflict: 'user_id' });

    return html(`Connected to channel: <strong>${channel?.snippet?.title ?? 'YouTube'}</strong>`);
  } catch (e) {
    return html(String(e), false);
  }
});