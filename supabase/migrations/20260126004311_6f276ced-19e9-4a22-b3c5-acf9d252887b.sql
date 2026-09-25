-- Create music video settings table (admin configurable)
CREATE TABLE public.music_video_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reels_price numeric NOT NULL DEFAULT 99.99,
  full_video_price numeric NOT NULL DEFAULT 249.99,
  upgrade_720p_price numeric NOT NULL DEFAULT 0,
  upgrade_1080p_price numeric NOT NULL DEFAULT 29.99,
  demo_reels_url text,
  demo_full_video_url text,
  available_upgrades jsonb DEFAULT '[
    {"id": "rush", "name": "Rush Delivery (48hrs)", "price": 49.99},
    {"id": "lyrics", "name": "Lyric Overlay", "price": 29.99},
    {"id": "effects", "name": "Premium Effects Pack", "price": 39.99}
  ]'::jsonb,
  headline text DEFAULT 'Custom Music Videos',
  subheadline text DEFAULT 'Bring your song to life with stunning visuals',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create music video orders table
CREATE TABLE public.music_video_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  video_style text NOT NULL CHECK (video_style IN ('reels', 'full')),
  video_quality text NOT NULL CHECK (video_quality IN ('720p', '1080p')),
  vision_description text NOT NULL,
  song_url text NOT NULL,
  base_price numeric NOT NULL,
  upgrades jsonb DEFAULT '[]'::jsonb,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'in_progress', 'completed', 'cancelled')),
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create music video order images table
CREATE TABLE public.music_video_order_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.music_video_orders(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.music_video_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_video_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.music_video_order_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for music_video_settings
CREATE POLICY "Anyone can read music video settings"
ON public.music_video_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage music video settings"
ON public.music_video_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for music_video_orders
CREATE POLICY "Users can view their own orders"
ON public.music_video_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON public.music_video_orders FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can create orders"
ON public.music_video_orders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update orders"
ON public.music_video_orders FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
ON public.music_video_orders FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for music_video_order_images
CREATE POLICY "Users can view their own order images"
ON public.music_video_order_images FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.music_video_orders
  WHERE id = order_id AND user_id = auth.uid()
));

CREATE POLICY "Admins can view all order images"
ON public.music_video_order_images FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert order images"
ON public.music_video_order_images FOR INSERT
WITH CHECK (true);

-- Create storage bucket for music video uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('music-video-uploads', 'music-video-uploads', false);

-- Storage policies
CREATE POLICY "Anyone can upload music video files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music-video-uploads');

CREATE POLICY "Users can view their uploaded files"
ON storage.objects FOR SELECT
USING (bucket_id = 'music-video-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all music video files"
ON storage.objects FOR SELECT
USING (bucket_id = 'music-video-uploads' AND has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.music_video_settings (id) VALUES (gen_random_uuid());

-- Add trigger for updated_at
CREATE TRIGGER update_music_video_settings_updated_at
BEFORE UPDATE ON public.music_video_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_music_video_orders_updated_at
BEFORE UPDATE ON public.music_video_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();