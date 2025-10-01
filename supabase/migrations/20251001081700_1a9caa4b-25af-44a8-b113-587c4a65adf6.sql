-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  department TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create enum types for issues
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE issue_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create issues table
CREATE TABLE public.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status issue_status DEFAULT 'open',
  priority issue_priority DEFAULT 'medium',
  department TEXT,
  location TEXT,
  reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Enable RLS on issues
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Issues policies
CREATE POLICY "Authenticated users can view issues"
  ON public.issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create issues"
  ON public.issues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can update issues they reported"
  ON public.issues FOR UPDATE
  TO authenticated
  USING (auth.uid() = reported_by OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete issues they reported"
  ON public.issues FOR DELETE
  TO authenticated
  USING (auth.uid() = reported_by);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Authenticated users can view comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create attachments table
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on attachments
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Attachments policies
CREATE POLICY "Authenticated users can view attachments"
  ON public.attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create attachments"
  ON public.attachments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete attachments they uploaded"
  ON public.attachments FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for issue attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('issue-attachments', 'issue-attachments', false);

-- Storage policies for attachments
CREATE POLICY "Authenticated users can view attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'issue-attachments');

CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'issue-attachments');

CREATE POLICY "Users can delete their own attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'issue-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);