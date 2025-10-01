-- Add missing fields to issues table
ALTER TABLE public.issues
ADD COLUMN component TEXT,
ADD COLUMN operator TEXT,
ADD COLUMN notify_flag BOOLEAN DEFAULT false,
ADD COLUMN date TIMESTAMPTZ DEFAULT now();

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Activity logs policies
CREATE POLICY "Authenticated users can view activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_activity_logs_issue_id ON public.activity_logs(issue_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_issue_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.activity_logs (issue_id, user_id, action, details)
    VALUES (NEW.id, NEW.reported_by, 'created', row_to_json(NEW)::jsonb);
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.activity_logs (issue_id, user_id, action, details)
    VALUES (NEW.id, auth.uid(), 'updated', jsonb_build_object(
      'old', row_to_json(OLD)::jsonb,
      'new', row_to_json(NEW)::jsonb
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic activity logging
CREATE TRIGGER log_issue_activity_trigger
  AFTER INSERT OR UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.log_issue_activity();