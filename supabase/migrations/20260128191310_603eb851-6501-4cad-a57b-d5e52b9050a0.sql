-- Create partner_links table
CREATE TABLE public.partner_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;

-- Admins can manage partner links
CREATE POLICY "Admins can manage partner links"
ON public.partner_links
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active partner links
CREATE POLICY "Anyone can view active partner links"
ON public.partner_links
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_partner_links_updated_at
BEFORE UPDATE ON public.partner_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default partner links
INSERT INTO public.partner_links (name, url, display_order) VALUES
  ('SyncStarz', 'https://syncstarz.com', 1),
  ('BeatStars', 'https://beatstars.com/jokabeatz', 2);