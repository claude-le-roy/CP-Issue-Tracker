-- Drop and recreate the enum with the new value
ALTER TABLE public.issues ALTER COLUMN status DROP DEFAULT;

-- Create new enum type with pending
CREATE TYPE issue_status_new AS ENUM ('pending', 'open', 'in_progress', 'resolved', 'closed');

-- Update the column to use the new type
ALTER TABLE public.issues 
  ALTER COLUMN status TYPE issue_status_new 
  USING (
    CASE 
      WHEN status::text = 'open' THEN 'pending'::issue_status_new
      ELSE status::text::issue_status_new
    END
  );

-- Drop old type and rename new one
DROP TYPE issue_status;
ALTER TYPE issue_status_new RENAME TO issue_status;

-- Set the new default
ALTER TABLE public.issues
  ALTER COLUMN status SET DEFAULT 'pending'::issue_status;

-- Remove old columns
ALTER TABLE public.issues 
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS department;

-- Add new columns
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS responsible_department text,
  ADD COLUMN IF NOT EXISTS issue_logger text,
  ADD COLUMN IF NOT EXISTS resolution_steps text,
  ADD COLUMN IF NOT EXISTS issue_updates jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS technical_team_notified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS closing_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS time_to_resolve interval;

-- Create function to calculate time to resolve
CREATE OR REPLACE FUNCTION calculate_time_to_resolve()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND NEW.closing_date IS NOT NULL THEN
    NEW.time_to_resolve = NEW.closing_date - NEW.created_at;
  ELSE
    NEW.time_to_resolve = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-calculating time to resolve
DROP TRIGGER IF EXISTS trigger_calculate_time_to_resolve ON public.issues;
CREATE TRIGGER trigger_calculate_time_to_resolve
  BEFORE INSERT OR UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_to_resolve();