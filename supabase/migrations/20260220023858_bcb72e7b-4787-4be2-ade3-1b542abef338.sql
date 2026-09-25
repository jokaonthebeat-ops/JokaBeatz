-- Allow users to delete their own mastering jobs
CREATE POLICY "Users can delete their own mastering jobs"
ON public.mastering_jobs
FOR DELETE
USING (auth.uid() = user_id);