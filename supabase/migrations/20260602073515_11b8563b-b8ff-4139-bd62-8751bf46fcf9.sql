-- Live customer location broadcast (Rapido-style)
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id uuid NOT NULL PRIMARY KEY,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading double precision,
  speed double precision,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.user_locations TO authenticated;
GRANT ALL ON public.user_locations TO service_role;

ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User upsert own location" ON public.user_locations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "User update own location" ON public.user_locations
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "User read own location" ON public.user_locations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Mechanic can read the user's live location while they have an accepted response
CREATE POLICY "Mechanic read accepted user location" ON public.user_locations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.mechanic_responses mr
      JOIN public.issues i ON i.id = mr.issue_id
      WHERE i.user_id = user_locations.user_id
        AND mr.mechanic_id = auth.uid()
        AND mr.status = 'accepted'
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;