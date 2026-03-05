
-- Create user_pins table for PIN-based auth
CREATE TABLE IF NOT EXISTS public.user_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  pin text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- Add user_rating to mechanic_responses
ALTER TABLE public.mechanic_responses ADD COLUMN IF NOT EXISTS user_rating integer;

-- Rating trigger function
CREATE OR REPLACE FUNCTION public.update_mechanic_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE mechanic_profiles SET
    rating = (SELECT COALESCE(AVG(user_rating)::numeric, 0) FROM mechanic_responses WHERE mechanic_id = NEW.mechanic_id AND user_rating IS NOT NULL),
    total_ratings = (SELECT COUNT(*)::integer FROM mechanic_responses WHERE mechanic_id = NEW.mechanic_id AND user_rating IS NOT NULL)
  WHERE user_id = NEW.mechanic_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_rating_trigger ON public.mechanic_responses;
CREATE TRIGGER update_rating_trigger
AFTER UPDATE OF user_rating ON public.mechanic_responses
FOR EACH ROW
WHEN (NEW.user_rating IS NOT NULL)
EXECUTE FUNCTION public.update_mechanic_rating();

-- ============================
-- FIX ALL RLS POLICIES (PERMISSIVE)
-- ============================

-- issues
DROP POLICY IF EXISTS "Users can read own issues" ON public.issues;
DROP POLICY IF EXISTS "Mechanics can read open issues" ON public.issues;
DROP POLICY IF EXISTS "Users can insert issues" ON public.issues;
DROP POLICY IF EXISTS "Users can update own issues" ON public.issues;
DROP POLICY IF EXISTS "Users read own issues" ON public.issues;
DROP POLICY IF EXISTS "Mechanics read open issues" ON public.issues;
DROP POLICY IF EXISTS "Users insert issues" ON public.issues;
DROP POLICY IF EXISTS "Users update own issues" ON public.issues;

CREATE POLICY "Users read own issues" ON public.issues FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics read open issues" ON public.issues FOR SELECT TO authenticated USING (has_role(auth.uid(), 'mechanic'::app_role));
CREATE POLICY "Users insert issues" ON public.issues FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own issues" ON public.issues FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- mechanic_profiles
DROP POLICY IF EXISTS "Anyone authed can read mechanic profiles" ON public.mechanic_profiles;
DROP POLICY IF EXISTS "Mechanics can insert own profile" ON public.mechanic_profiles;
DROP POLICY IF EXISTS "Mechanics can update own profile" ON public.mechanic_profiles;
DROP POLICY IF EXISTS "Read mechanic profiles" ON public.mechanic_profiles;
DROP POLICY IF EXISTS "Insert mechanic profile" ON public.mechanic_profiles;
DROP POLICY IF EXISTS "Update mechanic profile" ON public.mechanic_profiles;

CREATE POLICY "Read mechanic profiles" ON public.mechanic_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert mechanic profile" ON public.mechanic_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update mechanic profile" ON public.mechanic_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- mechanic_responses
DROP POLICY IF EXISTS "Read responses" ON public.mechanic_responses;
DROP POLICY IF EXISTS "Mechanics can insert responses" ON public.mechanic_responses;
DROP POLICY IF EXISTS "Mechanics can update own responses" ON public.mechanic_responses;
DROP POLICY IF EXISTS "Insert responses" ON public.mechanic_responses;
DROP POLICY IF EXISTS "Mechanic update responses" ON public.mechanic_responses;
DROP POLICY IF EXISTS "User rate responses" ON public.mechanic_responses;

CREATE POLICY "Read responses" ON public.mechanic_responses FOR SELECT TO authenticated USING (
  (EXISTS (SELECT 1 FROM issues WHERE issues.id = mechanic_responses.issue_id AND issues.user_id = auth.uid()))
  OR (mechanic_id = auth.uid())
);
CREATE POLICY "Insert responses" ON public.mechanic_responses FOR INSERT TO authenticated WITH CHECK (mechanic_id = auth.uid());
CREATE POLICY "Mechanic update responses" ON public.mechanic_responses FOR UPDATE TO authenticated USING (mechanic_id = auth.uid());
CREATE POLICY "User rate responses" ON public.mechanic_responses FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM issues WHERE issues.id = mechanic_responses.issue_id AND issues.user_id = auth.uid())
);

-- messages
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Read messages" ON public.messages;
DROP POLICY IF EXISTS "Insert messages" ON public.messages;

CREATE POLICY "Read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM issues i WHERE i.id = messages.issue_id AND (i.user_id = auth.uid() OR EXISTS (SELECT 1 FROM mechanic_responses mr WHERE mr.issue_id = i.id AND mr.mechanic_id = auth.uid())))
);
CREATE POLICY "Insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM issues i WHERE i.id = messages.issue_id AND (i.user_id = auth.uid() OR EXISTS (SELECT 1 FROM mechanic_responses mr WHERE mr.issue_id = i.id AND mr.mechanic_id = auth.uid())))
);

-- profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Mechanics can read consented profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Mechanics read consented profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;

CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics read consented profiles" ON public.profiles FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'mechanic'::app_role) AND EXISTS (SELECT 1 FROM phone_share_consents psc WHERE psc.user_id = profiles.user_id AND psc.mechanic_id = auth.uid() AND psc.granted = true)
);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Insert own role" ON public.user_roles;

CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- vehicles
DROP POLICY IF EXISTS "Users can read own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Mechanics can read issue vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Read own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Mechanics read vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Insert vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Delete own vehicles" ON public.vehicles;

CREATE POLICY "Read own vehicles" ON public.vehicles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics read vehicles" ON public.vehicles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'mechanic'::app_role));
CREATE POLICY "Insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Delete own vehicles" ON public.vehicles FOR DELETE TO authenticated USING (user_id = auth.uid());

-- phone_share_consents
DROP POLICY IF EXISTS "Users can manage own consents" ON public.phone_share_consents;
DROP POLICY IF EXISTS "Mechanics can read granted consents" ON public.phone_share_consents;
DROP POLICY IF EXISTS "Manage own consents" ON public.phone_share_consents;
DROP POLICY IF EXISTS "Mechanics read consents" ON public.phone_share_consents;

CREATE POLICY "Manage own consents" ON public.phone_share_consents FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics read consents" ON public.phone_share_consents FOR SELECT TO authenticated USING (mechanic_id = auth.uid() AND granted = true);
