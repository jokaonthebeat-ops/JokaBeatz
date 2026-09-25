-- Add YouTube video ID column to products table for demo videos
ALTER TABLE public.products 
ADD COLUMN youtube_video_id text DEFAULT NULL;