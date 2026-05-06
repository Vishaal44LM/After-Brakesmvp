
CREATE TABLE IF NOT EXISTS public.mechanic_locations (
  mechanic_id uuid PRIMARY KEY,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  speed double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mechanic_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mechanic upsert own location"
ON public.mechanic_locations FOR INSERT TO authenticated
WITH CHECK (mechanic_id = auth.uid());

CREATE POLICY "Mechanic update own location"
ON public.mechanic_locations FOR UPDATE TO authenticated
USING (mechanic_id = auth.uid());

CREATE POLICY "Mechanic read own location"
ON public.mechanic_locations FOR SELECT TO authenticated
USING (mechanic_id = auth.uid());

CREATE POLICY "Users read accepted mechanic location"
ON public.mechanic_locations FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.mechanic_responses mr
  JOIN public.issues i ON i.id = mr.issue_id
  WHERE mr.mechanic_id = mechanic_locations.mechanic_id
    AND i.user_id = auth.uid()
    AND mr.status = 'accepted'
));

ALTER TABLE public.mechanic_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mechanic_locations;
