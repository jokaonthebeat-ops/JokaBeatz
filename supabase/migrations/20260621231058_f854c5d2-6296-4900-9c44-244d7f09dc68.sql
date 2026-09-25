
-- 1. Mastering files: remove broad public read
DROP POLICY IF EXISTS "Anyone can view mastering files" ON storage.objects;

-- 2. music_video_order_images: restrict insert to owner of order (or service role)
DROP POLICY IF EXISTS "Anyone can insert order images" ON public.music_video_order_images;
CREATE POLICY "Users can insert images for their own orders"
ON public.music_video_order_images
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.music_video_orders mo
    WHERE mo.id = order_id AND mo.user_id = auth.uid()
  )
);

-- 3. user_notifications: restrict insert to service_role only
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.user_notifications;
CREATE POLICY "Service role can insert notifications"
ON public.user_notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. email_sequence_logs: restrict insert to service_role only
DROP POLICY IF EXISTS "Service role can insert sequence logs" ON public.email_sequence_logs;
CREATE POLICY "Service role can insert sequence logs"
ON public.email_sequence_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. email_tracking_events: restrict insert to service_role only
DROP POLICY IF EXISTS "Service role can insert tracking events" ON public.email_tracking_events;
CREATE POLICY "Service role can insert tracking events"
ON public.email_tracking_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- 6. Remove sensitive order tables from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.music_video_orders;
ALTER PUBLICATION supabase_realtime DROP TABLE public.service_orders;

-- 7. Lock down SECURITY DEFINER helper/trigger functions from public execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
