-- Create free_beats table for managing downloadable beats
CREATE TABLE public.free_beats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  bpm INTEGER,
  genre TEXT,
  preview_url TEXT NOT NULL,
  download_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.free_beats ENABLE ROW LEVEL SECURITY;

-- Admins can manage all free beats
CREATE POLICY "Admins can manage free beats"
ON public.free_beats
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view active beats
CREATE POLICY "Anyone can view active free beats"
ON public.free_beats
FOR SELECT
USING (active = true);

-- Trigger for updated_at
CREATE TRIGGER update_free_beats_updated_at
BEFORE UPDATE ON public.free_beats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();