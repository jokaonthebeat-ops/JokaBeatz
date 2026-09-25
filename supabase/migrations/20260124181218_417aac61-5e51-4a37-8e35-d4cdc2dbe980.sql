-- Add analytics columns to email_campaigns table
ALTER TABLE public.email_campaigns
ADD COLUMN IF NOT EXISTS emails_sent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_delivered integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_opened integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_clicked integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS emails_bounced integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_opens integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_clicks integer DEFAULT 0;

-- Create table for individual email tracking events
CREATE TABLE public.email_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  event_type text NOT NULL, -- 'delivered', 'opened', 'clicked', 'bounced', 'complained'
  event_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_email_tracking_campaign ON public.email_tracking_events(campaign_id);
CREATE INDEX idx_email_tracking_event_type ON public.email_tracking_events(event_type);

-- Enable RLS
ALTER TABLE public.email_tracking_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view tracking events
CREATE POLICY "Admins can view email tracking events"
ON public.email_tracking_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert (for webhook)
CREATE POLICY "Service role can insert tracking events"
ON public.email_tracking_events
FOR INSERT
WITH CHECK (true);