CREATE OR REPLACE FUNCTION public.generate_beat_slug()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE base_slug text; new_slug text; counter integer := 0;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.slug IS NOT NULL AND NEW.slug <> '' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' AND NEW.slug IS NOT NULL AND NEW.slug <> '' THEN RETURN NEW; END IF;
  base_slug := lower(trim(coalesce(NEW.title, '')));
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from substring(base_slug from 1 for 60));
  IF base_slug = '' THEN base_slug := 'beat-' || left(NEW.id::text, 8); END IF;
  new_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.beats WHERE slug = new_slug AND id <> NEW.id) LOOP
    counter := counter + 1; new_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := new_slug; RETURN NEW;
END; $function$;

UPDATE public.beats SET slug = 'beat-' || left(id::text, 8) WHERE slug IS NULL OR slug = '';