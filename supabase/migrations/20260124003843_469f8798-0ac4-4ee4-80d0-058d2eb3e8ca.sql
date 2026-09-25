-- Create site_settings table for SEO and social media configuration
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read site settings (needed for SEO on public pages)
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Admins can manage site settings
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default SEO values
INSERT INTO public.site_settings (key, value) VALUES
  ('seo_title', 'Joka Beatz - Industry-Ready Beats & Pro Studio Services'),
  ('seo_description', 'Professional beats, custom music production, mixing & mastering services. Get industry-ready instrumentals for your next hit.'),
  ('seo_keywords', 'beats, instrumentals, music production, mixing, mastering, hip hop beats, rap beats, custom beats'),
  ('og_image', ''),
  ('twitter_handle', '@JokaBeatz'),
  ('theme_color', '#DC2626'),
  ('instagram_url', ''),
  ('youtube_url', ''),
  ('twitter_url', ''),
  ('beatstars_url', '');