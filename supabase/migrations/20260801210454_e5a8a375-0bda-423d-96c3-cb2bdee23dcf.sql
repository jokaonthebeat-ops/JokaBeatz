-- 1. has_role hardening: only allow checking your own roles (or from server-side/service contexts)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 2. contact_messages: admin-only SELECT scoped to authenticated role
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. email_campaigns: explicit admin policies scoped to authenticated
DROP POLICY IF EXISTS "Admins can manage email campaigns" ON public.email_campaigns;
CREATE POLICY "Admins can view email campaigns"
ON public.email_campaigns FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert email campaigns"
ON public.email_campaigns FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update email campaigns"
ON public.email_campaigns FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete email campaigns"
ON public.email_campaigns FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. email_templates: default templates no longer public
DROP POLICY IF EXISTS "Anyone can view default templates" ON public.email_templates;
CREATE POLICY "Authenticated users can view default templates"
ON public.email_templates FOR SELECT TO authenticated
USING (is_default = true);

-- 5. music_video_orders: ownership enforced on insert
DROP POLICY IF EXISTS "Anyone can create orders" ON public.music_video_orders;
CREATE POLICY "Orders must match the creator"
ON public.music_video_orders FOR INSERT TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 6. service_orders: ownership enforced on insert
DROP POLICY IF EXISTS "Anyone can create service orders" ON public.service_orders;
CREATE POLICY "Service orders must match the creator"
ON public.service_orders FOR INSERT TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- 7. storage: remove anon from music video upload policy
DROP POLICY IF EXISTS "Authenticated users can upload music video files" ON storage.objects;
CREATE POLICY "Authenticated users can upload music video files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'music-video-uploads' AND auth.uid() IS NOT NULL);