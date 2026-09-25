-- Add tracking columns to email_sequence_logs for analytics
ALTER TABLE public.email_sequence_logs 
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS clicked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS bounced_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS open_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0;

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_sequence_logs_step_id ON public.email_sequence_logs(step_id);
CREATE INDEX IF NOT EXISTS idx_sequence_logs_enrollment_id ON public.email_sequence_logs(enrollment_id);