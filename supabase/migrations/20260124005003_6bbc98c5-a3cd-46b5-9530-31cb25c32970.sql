-- Create storage bucket for OG images
INSERT INTO storage.buckets (id, name, public)
VALUES ('og-images', 'og-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public access to OG images
CREATE POLICY "OG images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'og-images');

-- Create policy for admin uploads
CREATE POLICY "Admins can upload OG images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'og-images' AND public.has_role(auth.uid(), 'admin'));

-- Create policy for admin updates
CREATE POLICY "Admins can update OG images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'og-images' AND public.has_role(auth.uid(), 'admin'));

-- Create policy for admin deletes
CREATE POLICY "Admins can delete OG images"
ON storage.objects FOR DELETE
USING (bucket_id = 'og-images' AND public.has_role(auth.uid(), 'admin'));