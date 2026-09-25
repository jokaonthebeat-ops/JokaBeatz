-- Create storage bucket for free beats cover art
INSERT INTO storage.buckets (id, name, public)
VALUES ('free-beats-covers', 'free-beats-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload cover art
CREATE POLICY "Admins can upload cover art"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'free-beats-covers' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update cover art
CREATE POLICY "Admins can update cover art"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'free-beats-covers' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete cover art
CREATE POLICY "Admins can delete cover art"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'free-beats-covers' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public read access to cover art
CREATE POLICY "Anyone can view cover art"
ON storage.objects
FOR SELECT
USING (bucket_id = 'free-beats-covers');