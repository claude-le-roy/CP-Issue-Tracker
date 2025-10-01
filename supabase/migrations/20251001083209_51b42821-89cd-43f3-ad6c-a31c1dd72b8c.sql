-- Create user roles enum
CREATE TYPE user_role AS ENUM ('reporter', 'technician', 'manager', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = check_user_id 
  LIMIT 1;
$$;

-- Create helper function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = check_role
  );
$$;

-- Create helper function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(check_user_id UUID, check_roles user_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = ANY(check_roles)
  );
$$;

-- Policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user to assign default 'reporter' role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'reporter' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'reporter');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

-- Update issues table policies to be role-aware
DROP POLICY IF EXISTS "Users can update issues they reported" ON public.issues;
DROP POLICY IF EXISTS "Users can delete issues they reported" ON public.issues;

CREATE POLICY "Users can update issues based on role"
  ON public.issues FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = reported_by 
    OR auth.uid() = assigned_to
    OR public.has_any_role(auth.uid(), ARRAY['technician', 'manager', 'admin']::user_role[])
  );

CREATE POLICY "Users can delete issues based on role"
  ON public.issues FOR DELETE
  TO authenticated
  USING (
    auth.uid() = reported_by 
    OR public.has_any_role(auth.uid(), ARRAY['manager', 'admin']::user_role[])
  );