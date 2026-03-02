
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('user', 'mechanic');

-- OTP codes (accessed only via edge function with service role, no RLS)
CREATE TABLE public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone text NOT NULL,
  name text,
  area text,
  pincode text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mechanic profiles
CREATE TABLE public.mechanic_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  garage_name text NOT NULL,
  garage_photo_url text,
  area text NOT NULL,
  pincode text NOT NULL,
  rating numeric DEFAULT 0,
  total_ratings integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.mechanic_profiles ENABLE ROW LEVEL SECURITY;

-- Vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_type text NOT NULL,
  vehicle_brand text,
  vehicle_model text,
  vehicle_year text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Issues
CREATE TABLE public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id),
  description text,
  image_url text,
  ai_analysis jsonb,
  status text DEFAULT 'open' NOT NULL,
  pincode text,
  area text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Mechanic responses
CREATE TABLE public.mechanic_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  mechanic_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  price_quote integer NOT NULL,
  message text,
  availability text,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.mechanic_responses ENABLE ROW LEVEL SECURITY;

-- Messages (chat)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Phone share consents
CREATE TABLE public.phone_share_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mechanic_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  granted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(issue_id, mechanic_id)
);
ALTER TABLE public.phone_share_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- mechanic_profiles
CREATE POLICY "Anyone authed can read mechanic profiles" ON public.mechanic_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Mechanics can insert own profile" ON public.mechanic_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Mechanics can update own profile" ON public.mechanic_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- vehicles
CREATE POLICY "Users can read own vehicles" ON public.vehicles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert vehicles" ON public.vehicles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own vehicles" ON public.vehicles
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own vehicles" ON public.vehicles
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- issues
CREATE POLICY "Users can read own issues" ON public.issues
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics can read open issues" ON public.issues
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'mechanic'));
CREATE POLICY "Users can insert issues" ON public.issues
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own issues" ON public.issues
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- mechanic_responses
CREATE POLICY "Mechanics can insert responses" ON public.mechanic_responses
  FOR INSERT TO authenticated WITH CHECK (mechanic_id = auth.uid());
CREATE POLICY "Read responses" ON public.mechanic_responses
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.issues WHERE id = issue_id AND user_id = auth.uid())
    OR mechanic_id = auth.uid()
  );
CREATE POLICY "Mechanics can update own responses" ON public.mechanic_responses
  FOR UPDATE TO authenticated USING (mechanic_id = auth.uid());

-- messages
CREATE POLICY "Participants can read messages" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (i.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.mechanic_responses mr WHERE mr.issue_id = i.id AND mr.mechanic_id = auth.uid()
      ))
    )
  );
CREATE POLICY "Participants can insert messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_id
      AND (i.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.mechanic_responses mr WHERE mr.issue_id = i.id AND mr.mechanic_id = auth.uid()
      ))
    )
  );

-- phone_share_consents
CREATE POLICY "Users can manage own consents" ON public.phone_share_consents
  FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Mechanics can read granted consents" ON public.phone_share_consents
  FOR SELECT TO authenticated USING (mechanic_id = auth.uid() AND granted = true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('issue-images', 'issue-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('garage-photos', 'garage-photos', true);

-- Storage policies
CREATE POLICY "Auth users upload issue images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'issue-images');
CREATE POLICY "Public read issue images" ON storage.objects
  FOR SELECT USING (bucket_id = 'issue-images');
CREATE POLICY "Auth users upload garage photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'garage-photos');
CREATE POLICY "Public read garage photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'garage-photos');
