
-- Create emergency_alerts table
CREATE TABLE public.emergency_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_phone TEXT,
  user_area TEXT,
  vehicle_info TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Users can read and create their own alerts
CREATE POLICY "Users manage own alerts" ON public.emergency_alerts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Mechanics can read all active alerts
CREATE POLICY "Mechanics read active alerts" ON public.emergency_alerts
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'mechanic'::app_role));

-- Add phone_number column to mechanic_profiles
ALTER TABLE public.mechanic_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add phone_number column to profiles (user phone is already there as 'phone', but let's keep it)
