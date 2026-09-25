-- Add og_image column to blog_posts for dedicated 1200x630 social sharing images
ALTER TABLE public.blog_posts ADD COLUMN og_image TEXT;