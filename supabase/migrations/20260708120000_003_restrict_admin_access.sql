/*
# Restrict Admin Access

Replaces broad authenticated write policies with admin/editor checks backed by
admin_profiles. Run this after the initial schema migrations.
*/

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Core booking/content tables
DROP POLICY IF EXISTS "barbers_admin_insert" ON barbers;
DROP POLICY IF EXISTS "barbers_admin_update" ON barbers;
DROP POLICY IF EXISTS "barbers_admin_delete" ON barbers;
CREATE POLICY "barbers_admin_insert" ON barbers FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "barbers_admin_update" ON barbers FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "barbers_admin_delete" ON barbers FOR DELETE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "services_admin_insert" ON services;
DROP POLICY IF EXISTS "services_admin_update" ON services;
DROP POLICY IF EXISTS "services_admin_delete" ON services;
CREATE POLICY "services_admin_insert" ON services FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "services_admin_update" ON services FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "services_admin_delete" ON services FOR DELETE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "appointments_admin_update" ON appointments;
DROP POLICY IF EXISTS "appointments_admin_delete" ON appointments;
CREATE POLICY "appointments_admin_update" ON appointments FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "appointments_admin_delete" ON appointments FOR DELETE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "reviews_admin_update" ON reviews;
DROP POLICY IF EXISTS "reviews_admin_delete" ON reviews;
CREATE POLICY "reviews_admin_update" ON reviews FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "reviews_admin_delete" ON reviews FOR DELETE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "blocked_dates_admin_insert" ON blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_admin_update" ON blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_admin_delete" ON blocked_dates;
CREATE POLICY "blocked_dates_admin_insert" ON blocked_dates FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "blocked_dates_admin_update" ON blocked_dates FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "blocked_dates_admin_delete" ON blocked_dates FOR DELETE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "opening_hours_admin_insert" ON opening_hours;
DROP POLICY IF EXISTS "opening_hours_admin_update" ON opening_hours;
DROP POLICY IF EXISTS "opening_hours_admin_delete" ON opening_hours;
CREATE POLICY "opening_hours_admin_insert" ON opening_hours FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());
CREATE POLICY "opening_hours_admin_update" ON opening_hours FOR UPDATE TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());
CREATE POLICY "opening_hours_admin_delete" ON opening_hours FOR DELETE TO authenticated USING (public.is_admin_user());

-- Extended admin tables
DROP POLICY IF EXISTS "gallery_admin_all" ON gallery_images;
CREATE POLICY "gallery_admin_all" ON gallery_images FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "faq_admin_all" ON faq_items;
CREATE POLICY "faq_admin_all" ON faq_items FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "hero_admin_all" ON hero_content;
CREATE POLICY "hero_admin_all" ON hero_content FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "settings_admin_all" ON site_settings;
CREATE POLICY "settings_admin_all" ON site_settings FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "contact_admin_all" ON contact_info;
CREATE POLICY "contact_admin_all" ON contact_info FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "social_admin_all" ON social_links;
CREATE POLICY "social_admin_all" ON social_links FOR ALL TO authenticated USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "activity_log_read" ON activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
CREATE POLICY "activity_log_read" ON activity_log FOR SELECT TO authenticated USING (public.is_admin_user());
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "analytics_read" ON analytics_events;
CREATE POLICY "analytics_read" ON analytics_events FOR SELECT TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin_profiles_read" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_update" ON admin_profiles;
CREATE POLICY "admin_profiles_read" ON admin_profiles FOR SELECT TO authenticated USING (public.is_admin_user() OR auth.uid() = id);
CREATE POLICY "admin_profiles_update" ON admin_profiles FOR UPDATE TO authenticated USING (public.is_owner_admin()) WITH CHECK (public.is_owner_admin());
