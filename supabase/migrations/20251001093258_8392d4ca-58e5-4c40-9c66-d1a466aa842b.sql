-- Fix function search path security issue
CREATE OR REPLACE FUNCTION calculate_time_to_resolve()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'closed' AND NEW.closing_date IS NOT NULL THEN
    NEW.time_to_resolve = NEW.closing_date - NEW.created_at;
  ELSE
    NEW.time_to_resolve = NULL;
  END IF;
  RETURN NEW;
END;
$$;