CREATE TABLE public.beat_license_deliverables (
  license_id uuid PRIMARY KEY REFERENCES public.beat_licenses(id) ON DELETE CASCADE,
  paths text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beat_license_deliverables TO authenticated;
GRANT ALL ON public.beat_license_deliverables TO service_role;
REVOKE ALL ON public.beat_license_deliverables FROM anon;

ALTER TABLE public.beat_license_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins select deliverables" ON public.beat_license_deliverables
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert deliverables" ON public.beat_license_deliverables
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update deliverables" ON public.beat_license_deliverables
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete deliverables" ON public.beat_license_deliverables
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_beat_license_deliverables_updated_at
  BEFORE UPDATE ON public.beat_license_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.beat_license_deliverables (license_id, paths)
SELECT id, COALESCE(deliverable_paths, '{}') FROM public.beat_licenses
ON CONFLICT (license_id) DO UPDATE SET paths = EXCLUDED.paths;

ALTER TABLE public.beat_licenses DROP COLUMN deliverable_paths;