-- Add cover art image URL column to free_beats table
ALTER TABLE public.free_beats
ADD COLUMN image_url TEXT;