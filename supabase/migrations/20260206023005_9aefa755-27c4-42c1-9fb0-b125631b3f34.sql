-- Create mastering_services table for configuring AI mastering offerings
CREATE TABLE public.mastering_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    service_type text NOT NULL DEFAULT 'mastering', -- mastering, mixing, mix_enhance
    price_cents integer NOT NULL DEFAULT 999,
    sale_price_cents integer,
    stripe_price_id text,
    features text[] NOT NULL DEFAULT '{}',
    default_settings jsonb NOT NULL DEFAULT '{"musicalStyle": "OTHER", "desiredLoudness": "MEDIUM", "sampleRate": "44100"}',
    is_active boolean NOT NULL DEFAULT true,
    is_featured boolean NOT NULL DEFAULT false,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mastering_jobs table for tracking user mastering requests
CREATE TABLE public.mastering_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    service_id uuid REFERENCES public.mastering_services(id) ON DELETE SET NULL,
    task_id text, -- Tonn API task ID
    status text NOT NULL DEFAULT 'uploading', -- uploading, preview, pending_payment, processing, completed, failed
    processing_stage text, -- PENDING, STARTED, ANALYSIS, APPLY_FX, COMPLETED
    input_file_url text NOT NULL,
    preview_file_url text,
    output_file_url text,
    settings jsonb NOT NULL DEFAULT '{}',
    error_message text,
    stripe_session_id text,
    stripe_payment_intent_id text,
    price_cents integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.mastering_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastering_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mastering_services
CREATE POLICY "Anyone can view active mastering services"
ON public.mastering_services
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage mastering services"
ON public.mastering_services
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for mastering_jobs
CREATE POLICY "Users can view their own mastering jobs"
ON public.mastering_jobs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mastering jobs"
ON public.mastering_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all mastering jobs"
ON public.mastering_jobs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all mastering jobs"
ON public.mastering_jobs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to update jobs (for edge functions)
CREATE POLICY "Service role can update mastering jobs"
ON public.mastering_jobs
FOR UPDATE
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_mastering_services_updated_at
BEFORE UPDATE ON public.mastering_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mastering_jobs_updated_at
BEFORE UPDATE ON public.mastering_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for mastering files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mastering-files', 'mastering-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for mastering-files bucket
CREATE POLICY "Users can upload their own mastering files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'mastering-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view mastering files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'mastering-files');

CREATE POLICY "Users can delete their own mastering files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'mastering-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert default mastering service
INSERT INTO public.mastering_services (name, slug, description, service_type, price_cents, features, is_active, is_featured)
VALUES (
    'AI Mastering',
    'ai-mastering',
    'Professional AI-powered audio mastering. Get broadcast-ready masters in minutes.',
    'mastering',
    999,
    ARRAY['AI-powered mastering', 'Free 30-second preview', 'Multiple loudness options', 'High-quality output', 'Fast turnaround'],
    true,
    true
);