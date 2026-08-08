ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS service_name text,
  ADD COLUMN IF NOT EXISTS is_scheduled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS booking_status text NOT NULL DEFAULT 'waiting',
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

UPDATE public.issues SET service_name = COALESCE(service_name, issue_type) WHERE issue_type IS NOT NULL;

ALTER TABLE public.issues DROP COLUMN IF EXISTS issue_type;
ALTER TABLE public.issues DROP COLUMN IF EXISTS ai_analysis;

CREATE INDEX IF NOT EXISTS issues_scheduled_idx ON public.issues (is_scheduled, scheduled_at);
CREATE INDEX IF NOT EXISTS issues_booking_status_idx ON public.issues (booking_status);