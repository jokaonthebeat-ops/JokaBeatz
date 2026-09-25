-- Create a public bucket for demo videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('music-video-demos', 'music-video-demos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view demo videos
CREATE POLICY "Anyone can view demo videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'music-video-demos');

-- Allow admins to upload demo videos
CREATE POLICY "Admins can upload demo videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music-video-demos' AND has_role(auth.uid(), 'admin'));

-- Allow admins to update demo videos
CREATE POLICY "Admins can update demo videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'music-video-demos' AND has_role(auth.uid(), 'admin'));

-- Allow admins to delete demo videos
CREATE POLICY "Admins can delete demo videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'music-video-demos' AND has_role(auth.uid(), 'admin'));