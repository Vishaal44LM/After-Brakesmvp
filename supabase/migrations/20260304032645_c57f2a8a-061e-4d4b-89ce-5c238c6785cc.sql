
-- Fix all RLS policies from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Mechanics can read open issues" ON public.issues;
DROP POLICY IF EXISTS "Users can read own issues" ON public.issues;
DROP POLICY IF EXISTS "Users can insert issues" ON public.issues;
DROP POLICY IF EXISTS "Users can update own issues" ON public.issues;

CREATE POLICY "Users can read own issues" ON public.issues FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics can read open issues" ON public.issues FOR SELECT TO authenticated USING (has_role(auth.uid(), 'mechanic'::app_role));
CREATE POLICY "Users can insert issues" ON public.issues FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own issues" ON public.issues FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone authed can read mechanic profiles" ON public.mechanic_profiles;
DROP POLICY IF EXISTS "Mechanics can insert own profile" ON public.mechanic_profiles;
DROP POLICY IF EXISTS "Mechanics can update own profile" ON public.mechanic_profiles;

CREATE POLICY "Anyone authed can read mechanic profiles" ON public.mechanic_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mechanics can insert own profile" ON public.mechanic_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Mechanics can update own profile" ON public.mechanic_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Mechanics can insert responses" ON public.mechanic_responses;
DROP POLICY IF EXISTS "Mechanics can update own responses" ON public.mechanic_responses;
DROP POLICY IF EXISTS "Read responses" ON public.mechanic_responses;

CREATE POLICY "Read responses" ON public.mechanic_responses FOR SELECT TO authenticated USING (
  (EXISTS (SELECT 1 FROM issues WHERE issues.id = mechanic_responses.issue_id AND issues.user_id = auth.uid()))
  OR (mechanic_id = auth.uid())
);
CREATE POLICY "Mechanics can insert responses" ON public.mechanic_responses FOR INSERT TO authenticated WITH CHECK (mechanic_id = auth.uid());
CREATE POLICY "Mechanics can update own responses" ON public.mechanic_responses FOR UPDATE TO authenticated USING (mechanic_id = auth.uid());

DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;

CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM issues i WHERE i.id = messages.issue_id AND (i.user_id = auth.uid() OR EXISTS (SELECT 1 FROM mechanic_responses mr WHERE mr.issue_id = i.id AND mr.mechanic_id = auth.uid())))
);
CREATE POLICY "Participants can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM issues i WHERE i.id = messages.issue_id AND (i.user_id = auth.uid() OR EXISTS (SELECT 1 FROM mechanic_responses mr WHERE mr.issue_id = i.id AND mr.mechanic_id = auth.uid())))
);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics can read consented profiles" ON public.profiles FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'mechanic'::app_role) AND EXISTS (SELECT 1 FROM phone_share_consents psc WHERE psc.user_id = profiles.user_id AND psc.mechanic_id = auth.uid() AND psc.granted = true)
);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can read own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;

CREATE POLICY "Users can read own vehicles" ON public.vehicles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics can read issue vehicles" ON public.vehicles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'mechanic'::app_role));
CREATE POLICY "Users can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Mechanics can read granted consents" ON public.phone_share_consents;
DROP POLICY IF EXISTS "Users can manage own consents" ON public.phone_share_consents;

CREATE POLICY "Users can manage own consents" ON public.phone_share_consents FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics can read granted consents" ON public.phone_share_consents FOR SELECT TO authenticated USING (mechanic_id = auth.uid() AND granted = true);
