
-- Create enum types
CREATE TYPE public.issue_type AS ENUM ('scam', 'phishing', 'online_fraud', 'hacking_attempt', 'malware', 'social_media_threat', 'other');
CREATE TYPE public.incident_status AS ENUM ('new', 'in_progress', 'escalated', 'resolved', 'closed');
CREATE TYPE public.incident_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE public.app_role AS ENUM ('super_admin', 'cyber_admin', 'support_agent', 'auditor');
CREATE TYPE public.notification_channel AS ENUM ('email', 'sms', 'whatsapp');

-- Complaints table (public submission, no auth required)
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  user_identifier TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  issue_type public.issue_type NOT NULL,
  description TEXT NOT NULL,
  priority public.incident_priority NOT NULL DEFAULT 'low',
  status public.incident_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id),
  consent_notifications BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attachments table
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Profiles table for admin users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incident notes
CREATE TABLE public.incident_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification logs
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  complaint_id UUID REFERENCES public.complaints(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- has_role helper function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user has any admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'cyber_admin', 'support_agent', 'auditor')
  )
$$;

-- Complaints: anyone can insert (public form), admins can read/update
CREATE POLICY "Anyone can submit complaints" ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view complaints" ON public.complaints FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update complaints" ON public.complaints FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'cyber_admin') OR
  (public.has_role(auth.uid(), 'support_agent') AND assigned_to = auth.uid())
);

-- Attachments: anyone can insert, admins can view
CREATE POLICY "Anyone can upload attachments" ON public.attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view attachments" ON public.attachments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- User roles: only super_admin can manage
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Profiles
CREATE POLICY "Admins can view profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- Incident notes
CREATE POLICY "Admins can view notes" ON public.incident_notes FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can add notes" ON public.incident_notes FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'cyber_admin') OR public.has_role(auth.uid(), 'support_agent')
);

-- Notification logs
CREATE POLICY "Admins can view notifications" ON public.notification_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert notifications" ON public.notification_logs FOR INSERT WITH CHECK (true);

-- Audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'auditor')
);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Ticket code generation function
CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'GCX-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    IF i = 4 THEN result := result || '-'; END IF;
  END LOOP;
  RETURN result;
END;
$$;

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('incident-attachments', 'incident-attachments', true);

CREATE POLICY "Anyone can upload incident attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'incident-attachments');
CREATE POLICY "Admins can view incident attachments" ON storage.objects FOR SELECT USING (bucket_id = 'incident-attachments');
