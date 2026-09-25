-- Create table for page-specific SEO settings
CREATE TABLE public.page_seo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_seo_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read page SEO settings (needed for frontend)
CREATE POLICY "Anyone can read page SEO settings"
ON public.page_seo_settings
FOR SELECT
USING (true);

-- Only admins can manage page SEO settings
CREATE POLICY "Admins can manage page SEO settings"
ON public.page_seo_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_page_seo_settings_updated_at
BEFORE UPDATE ON public.page_seo_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default entries for all pages
INSERT INTO public.page_seo_settings (path, page_name, seo_title, seo_description, seo_keywords) VALUES
('/', 'Home', 'Buy Beats Online - Hip Hop, Trap, R&B Beats for Sale | Joka Beatz', 'Buy professional beats online. Hip Hop, Trap, R&B, AfroBeat & Pop instrumentals for sale. Instant delivery, affordable licenses, and custom production services.', 'buy beats, beats for sale, hip hop beats, trap beats, R&B beats, afrobeat, buy instrumentals, license beats, producer, music production'),
('/beats', 'Beats', 'Beats for Sale - License Hip Hop, Trap & R&B Beats | Joka Beatz', 'Browse and license professional beats. Hip Hop, Trap, R&B, and AfroBeat instrumentals available for instant download. Multiple licensing options starting at $29.99.', 'beats for sale, license beats, buy trap beats, hip hop instrumentals, R&B beats for sale, download beats, beat licensing, producer beats'),
('/services', 'Services', 'Music Production Services - Mixing, Mastering & Custom Beats | Joka Beatz', 'Professional music production services including custom beat production, mixing, mastering, and 1-on-1 artist consultation. Take your music to the next level.', 'music production services, mixing services, mastering services, custom beats, artist consultation, beat production, audio mixing, audio mastering'),
('/shop', 'Shop', 'Beat Packs & Drum Kits for Sale | Joka Beatz Shop', 'Shop premium digital products for music producers. Beat packs, drum kits, mixing presets, and production courses. Instant download after purchase.', 'beat packs, drum kits, producer presets, music production courses, FL Studio presets, 808 drum kit, trap beat pack, producer sounds'),
('/free-beats', 'Free Beats', 'Free Beats Download - Get 5 Free Hip Hop Beats | Joka Beatz', 'Download 5 free professional beats. Hip Hop, Trap, and R&B instrumentals delivered to your inbox. High-quality MP3s ready for recording. No credit card required.', 'free beats, free hip hop beats, download free beats, free trap beats, free R&B beats, free instrumentals, producer beats'),
('/free-guide', 'Free Guide', 'Free Sync Licensing Guide - Music Placement Ebook | Joka Beatz', 'Download the free ebook: How Music Placements Really Work in 2026. Learn how to get your music placed in TV, film, ads, and games from industry insiders.', 'sync licensing guide, music placement, music supervision, free ebook, licensing guide, TV placements, film music, sync placement tips'),
('/contact', 'Contact', 'Contact Joka Beatz - Book Custom Beats & Studio Sessions', 'Get in touch with Joka Beatz for custom beat production, mixing, mastering, or collaboration inquiries. Usually responds within 24-48 hours.', 'contact producer, book studio session, custom beats inquiry, mixing mastering quote, music collaboration, beat producer contact');