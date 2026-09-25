-- Drop the overly permissive policy and create a proper one
DROP POLICY IF EXISTS "Service role can update mastering jobs" ON public.mastering_jobs;

-- Create proper policy that allows users to update their own jobs
-- (Edge functions use service role which bypasses RLS anyway)
CREATE POLICY "Users can update their own mastering jobs"
ON public.mastering_jobs
FOR UPDATE
USING (auth.uid() = user_id);