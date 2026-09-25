CREATE TABLE public.app_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('banner','announcement','featured_playlist')),
  title text NOT NULL,
  body text,
  image_url text,
  link text,
  beat_id uuid REFERENCES public.beats(id) ON DELETE SET NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_content TO authenticated;
GRANT ALL ON public.app_content TO service_role;
ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads live app content" ON public.app_content FOR SELECT TO anon, authenticated
  USING (active AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));
CREATE POLICY "Admins manage app content" ON public.app_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_app_content_updated_at BEFORE UPDATE ON public.app_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX app_content_live_idx ON public.app_content (active, sort_order);

CREATE TABLE public.lyrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  beat_id uuid REFERENCES public.beats(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Untitled',
  body text NOT NULL DEFAULT '',
  bars_per_section integer NOT NULL DEFAULT 16,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lyrics TO authenticated;
GRANT ALL ON public.lyrics TO service_role;
ALTER TABLE public.lyrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lyrics" ON public.lyrics FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_lyrics_updated_at BEFORE UPDATE ON public.lyrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX lyrics_user_idx ON public.lyrics (user_id);

CREATE TABLE public.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  beat_id uuid REFERENCES public.beats(id) ON DELETE SET NULL,
  lyrics_id uuid REFERENCES public.lyrics(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Untitled take',
  duration_ms integer,
  storage_path text NOT NULL,
  mix_settings jsonb NOT NULL DEFAULT '{"beat_volume":1,"vocal_volume":1,"effect_preset":"none","latency_offset_ms":0}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recordings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recordings TO authenticated;
GRANT ALL ON public.recordings TO service_role;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own recordings" ON public.recordings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone reads public recordings" ON public.recordings FOR SELECT TO anon, authenticated
  USING (is_public AND NOT is_hidden);
CREATE POLICY "Admins read all recordings" ON public.recordings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update recordings" ON public.recordings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX recordings_user_idx ON public.recordings (user_id);
CREATE INDEX recordings_public_idx ON public.recordings (is_public, is_hidden, created_at DESC);

CREATE OR REPLACE FUNCTION public.protect_recording_hidden()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    IF TG_OP = 'INSERT' THEN NEW.is_hidden := false;
    ELSE NEW.is_hidden := OLD.is_hidden; END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER protect_recording_hidden BEFORE INSERT OR UPDATE ON public.recordings FOR EACH ROW EXECUTE FUNCTION public.protect_recording_hidden();

CREATE POLICY "Users upload own vocal takes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vocal-takes' AND (storage.foldername(name))[1] = auth.uid()::text
    AND lower(storage.extension(name)) IN ('m4a','aac','mp3','wav','caf','ogg','opus','webm','flac','aiff','aif'));
CREATE POLICY "Users read own vocal takes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vocal-takes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own vocal takes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vocal-takes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins read vocal takes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vocal-takes' AND public.has_role(auth.uid(),'admin'));