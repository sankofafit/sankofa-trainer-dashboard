CREATE TABLE IF NOT EXISTS public.trainer_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES public.trainers ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  url text DEFAULT '/',
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.trainer_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers see own notifications" ON public.trainer_notifications;
CREATE POLICY "Trainers see own notifications"
ON public.trainer_notifications FOR SELECT
TO authenticated
USING (
  trainer_id IN (
    SELECT id FROM public.trainers
    WHERE owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert notifications" ON public.trainer_notifications;
CREATE POLICY "System can insert notifications"
ON public.trainer_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Trainers update own notifications" ON public.trainer_notifications;
CREATE POLICY "Trainers update own notifications"
ON public.trainer_notifications FOR UPDATE
TO authenticated
USING (
  trainer_id IN (
    SELECT id FROM public.trainers
    WHERE owner_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_trainer_notifications_trainer_id
ON public.trainer_notifications(trainer_id);

CREATE INDEX IF NOT EXISTS idx_trainer_notifications_created_at
ON public.trainer_notifications(created_at DESC);
