-- Add progress tracking columns to music_video_orders
ALTER TABLE public.music_video_orders
ADD COLUMN progress_percent integer DEFAULT 0,
ADD COLUMN progress_note text,
ADD COLUMN final_video_url text,
ADD COLUMN notification_sent boolean DEFAULT false;

-- Create user_notifications table
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (true);

-- Create video deliverables storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('music-video-deliverables', 'music-video-deliverables', false);

-- Storage policies for music-video-deliverables bucket
CREATE POLICY "Admins can upload deliverables"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'music-video-deliverables' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update deliverables"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'music-video-deliverables' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can download their deliverables"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'music-video-deliverables'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.music_video_orders
        WHERE user_id = auth.uid()
        AND final_video_url LIKE '%' || storage.objects.name
        AND status = 'completed'
      )
    )
  );