-- Add AI Mastering page to SEO settings
INSERT INTO public.page_seo_settings (path, page_name, seo_title, seo_description)
VALUES (
  '/ai-mastering',
  'AI Mastering',
  'AI Mastering | Professional Audio Mastering | Joka Beatz',
  'Get radio-ready masters with our AI-powered mastering service. Professional quality results in minutes. Standard, Premium, and Batch options available.'
)
ON CONFLICT (path) DO NOTHING;