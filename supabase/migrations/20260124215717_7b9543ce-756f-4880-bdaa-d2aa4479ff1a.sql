-- Make campaign_id nullable for auto-enrollments that don't have a campaign
ALTER TABLE public.email_sequence_enrollments 
ALTER COLUMN campaign_id DROP NOT NULL;