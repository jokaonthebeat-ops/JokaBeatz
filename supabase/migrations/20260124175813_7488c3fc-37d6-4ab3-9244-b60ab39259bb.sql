-- Allow admins to delete free beat requests
CREATE POLICY "Admins can delete free beat requests"
ON public.free_beat_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete newsletter leads
CREATE POLICY "Admins can delete leads"
ON public.leads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));