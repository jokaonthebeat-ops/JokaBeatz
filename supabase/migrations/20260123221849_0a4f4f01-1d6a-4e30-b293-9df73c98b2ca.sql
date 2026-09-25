-- Create storage bucket for free beat audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('free-beats-audio', 'free-beats-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to audio files
CREATE POLICY "Public can view free beat audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'free-beats-audio');

-- Allow admins to manage audio files
CREATE POLICY "Admins can manage free beat audio"
ON storage.objects FOR ALL
USING (bucket_id = 'free-beats-audio' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'free-beats-audio' AND public.has_role(auth.uid(), 'admin'));