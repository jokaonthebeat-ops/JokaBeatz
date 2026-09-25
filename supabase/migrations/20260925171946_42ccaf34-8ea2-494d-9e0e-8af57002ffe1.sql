CREATE TABLE public.beats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  bpm integer,
  musical_key text,
  genre text,
  mood text,
  tags text[] NOT NULL DEFAULT '{}',
  description text,
  cover_image_url text,
  preview_audio_path text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  plays_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beats TO authenticated;
GRANT ALL ON public.beats TO service_role;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published beats" ON public.beats FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage beats" ON public.beats FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_beats_updated_at BEFORE UPDATE ON public.beats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_beat_slug()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE base_slug text; new_slug text; counter integer := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' AND (TG_OP = 'UPDATE' AND OLD.title = NEW.title) THEN RETURN NEW; END IF;
  base_slug := lower(trim(NEW.title));
  base_slug := regexp_replace(base_slug, '[^\w\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := substring(base_slug from 1 for 60);
  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.beats WHERE slug = new_slug AND id <> NEW.id) LOOP
    counter := counter + 1; new_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := new_slug; RETURN NEW;
END; $$;
CREATE TRIGGER generate_beat_slug_trigger BEFORE INSERT OR UPDATE ON public.beats FOR EACH ROW EXECUTE FUNCTION public.generate_beat_slug();

CREATE TABLE public.beat_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id uuid NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('mp3_lease','wav_lease','trackout','unlimited','exclusive')),
  price_cents integer NOT NULL DEFAULT 0,
  stripe_price_id text,
  deliverable_paths text[] NOT NULL DEFAULT '{}',
  terms_summary text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (beat_id, tier)
);
GRANT SELECT ON public.beat_licenses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beat_licenses TO authenticated;
GRANT ALL ON public.beat_licenses TO service_role;
ALTER TABLE public.beat_licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active licenses of published beats" ON public.beat_licenses FOR SELECT USING (
  public.has_role(auth.uid(),'admin') OR (active AND EXISTS (SELECT 1 FROM public.beats b WHERE b.id = beat_id AND b.status = 'published'))
);
CREATE POLICY "Admins manage licenses" ON public.beat_licenses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_beat_licenses_updated_at BEFORE UPDATE ON public.beat_licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Hide deliverable paths from public readers
REVOKE SELECT (deliverable_paths) ON public.beat_licenses FROM anon;

ALTER TABLE public.orders ADD COLUMN beat_id uuid REFERENCES public.beats(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN license_tier text;

CREATE POLICY "Admins manage beat deliverables" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'beat-deliverables' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'beat-deliverables' AND public.has_role(auth.uid(),'admin'));