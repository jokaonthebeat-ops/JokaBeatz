-- Add youtube_video_id column to site_settings table
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS youtube_video_id TEXT DEFAULT '1CIlH-Dwe_g';