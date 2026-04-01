
ALTER TABLE public.mechanic_profiles 
  ADD COLUMN IF NOT EXISTS id_proof_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS id_proof_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS years_of_experience integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS garage_address text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_maps_link text DEFAULT NULL;
