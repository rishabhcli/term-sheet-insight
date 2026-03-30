
-- Fix overly permissive event_logs INSERT policy
DROP POLICY "Users can insert own events" ON public.event_logs;
CREATE POLICY "Authenticated users can insert events" ON public.event_logs FOR INSERT TO authenticated WITH CHECK (
  user_id IS NULL OR auth.uid() = user_id
);
-- Also allow anon inserts with null user_id for anonymous analytics
CREATE POLICY "Anon users can insert events" ON public.event_logs FOR INSERT TO anon WITH CHECK (user_id IS NULL);
