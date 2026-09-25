-- Create service_orders table for tracking all service orders
CREATE TABLE public.service_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('custom_beats', 'mixing', 'mastering', 'consultation')),
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'in_progress', 'completed', 'cancelled')),
  project_notes text,
  file_urls jsonb DEFAULT '[]'::jsonb,
  additional_data jsonb DEFAULT '{}'::jsonb,
  progress_percent integer DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  progress_note text,
  final_delivery_url text,
  notification_sent boolean DEFAULT false,
  stripe_session_id text,
  stripe_payment_intent_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all service orders"
ON public.service_orders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own service orders"
ON public.service_orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create service orders"
ON public.service_orders FOR INSERT
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for service orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders;

-- Create storage bucket for service order uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-order-uploads', 'service-order-uploads', false);

-- Storage policies for service-order-uploads bucket
CREATE POLICY "Anyone can upload to service-order-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-order-uploads');

CREATE POLICY "Admins can view all service order uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-order-uploads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service order uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-order-uploads' AND has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for service deliverables
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-deliverables', 'service-deliverables', false);

-- Storage policies for service-deliverables bucket
CREATE POLICY "Admins can upload service deliverables"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-deliverables' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view service deliverables"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-deliverables' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own service deliverables"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'service-deliverables' AND 
  EXISTS (
    SELECT 1 FROM public.service_orders 
    WHERE service_orders.user_id = auth.uid() 
    AND service_orders.final_delivery_url LIKE '%' || storage.objects.name || '%'
  )
);

CREATE POLICY "Admins can delete service deliverables"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-deliverables' AND has_role(auth.uid(), 'admin'::app_role));