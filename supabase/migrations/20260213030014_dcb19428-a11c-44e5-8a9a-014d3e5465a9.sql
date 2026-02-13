
-- Drop all restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can submit complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can view complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Anyone can upload attachments" ON public.attachments;
DROP POLICY IF EXISTS "Admins can view attachments" ON public.attachments;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view notes" ON public.incident_notes;
DROP POLICY IF EXISTS "Admins can add notes" ON public.incident_notes;
DROP POLICY IF EXISTS "Admins can view notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Also drop storage policies
DROP POLICY IF EXISTS "Anyone can upload incident attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view incident attachments" ON storage.objects;

-- Recreate all as PERMISSIVE (default)

-- Complaints
CREATE POLICY "Anyone can submit complaints" ON public.complaints FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view complaints" ON public.complaints FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update complaints" ON public.complaints FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'cyber_admin') OR
  (public.has_role(auth.uid(), 'support_agent') AND assigned_to = auth.uid())
);

-- Attachments
CREATE POLICY "Anyone can upload attachments" ON public.attachments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view attachments" ON public.attachments FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- User roles
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Profiles
CREATE POLICY "Admins can view profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Incident notes
CREATE POLICY "Admins can view notes" ON public.incident_notes FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can add notes" ON public.incident_notes FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'cyber_admin') OR public.has_role(auth.uid(), 'support_agent')
);

-- Notification logs
CREATE POLICY "Admins can view notifications" ON public.notification_logs FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert notifications" ON public.notification_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'auditor')
);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Storage
CREATE POLICY "Anyone can upload incident attachments" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'incident-attachments');
CREATE POLICY "Anyone can view incident attachments" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'incident-attachments');
