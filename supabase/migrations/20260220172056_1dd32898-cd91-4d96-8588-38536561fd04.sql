-- Fix 1: Make mastering-files bucket private
UPDATE storage.buckets SET public = false WHERE id = 'mastering-files';

-- Fix 2: Tighten music-video-uploads upload policy to require authentication or at minimum a non-null check
-- Drop the unrestricted "Anyone can upload" policies
DROP POLICY IF EXISTS "Anyone can upload music video files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to service-order-uploads" ON storage.objects;

-- Re-create with auth.uid() IS NOT NULL check (allows both authenticated users and anon key uploads from the app)
-- For music-video-uploads: require authenticated session
CREATE POLICY "Authenticated users can upload music video files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'music-video-uploads'
  AND auth.role() IN ('authenticated', 'anon')
  AND auth.uid() IS NOT NULL
);

-- For service-order-uploads: require authenticated session
CREATE POLICY "Authenticated users can upload service files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'service-order-uploads'
  AND auth.uid() IS NOT NULL
);

-- Fix 3: Add signed URL support for mastering-files
-- Allow authenticated users to access their own mastering files via signed URLs
DROP POLICY IF EXISTS "Users can access their own mastering files" ON storage.objects;
CREATE POLICY "Users can access their own mastering files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mastering-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can access all mastering files
DROP POLICY IF EXISTS "Admins can access all mastering files" ON storage.objects;
CREATE POLICY "Admins can access all mastering files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mastering-files'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);