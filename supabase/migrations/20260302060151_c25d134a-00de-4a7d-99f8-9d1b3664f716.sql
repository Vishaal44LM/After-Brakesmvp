
-- Enable RLS on otp_codes (only accessed via service role in edge functions)
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
