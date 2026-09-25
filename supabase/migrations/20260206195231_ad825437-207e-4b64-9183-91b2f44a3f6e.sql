-- Add image_prompt column to page_seo_settings for creative control over OG images
ALTER TABLE public.page_seo_settings 
ADD COLUMN image_prompt text;