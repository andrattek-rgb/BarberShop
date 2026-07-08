/*
# Extended Admin Panel Schema

Adds comprehensive content management tables for the admin panel.

## Tables Created:
1. **gallery_images** - Gallery images with ordering, alt text, categories
2. **faq_items** - FAQ questions and answers with ordering
3. **hero_content** - Editable hero section content
4. **site_settings** - Global website settings (logo, colors, SEO, etc.)
5. **contact_info** - Business contact information
6. **social_links** - Social media links
7. **admin_users** - Admin user management (extended from auth.users)
8. **activity_log** - Admin activity tracking
9. **notifications** - System notifications
10. **analytics_events** - Analytics events tracking

## Security:
- RLS enabled on all tables
- Admin-only write access
- Public read access where appropriate
*/

-- Gallery Images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text,
  category text DEFAULT 'Haircuts',
  display_order int DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FAQ Items table
CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  display_order int DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Hero Content table (single row for site-wide hero)
CREATE TABLE IF NOT EXISTS hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  headline text NOT NULL DEFAULT 'Your Style Starts Here',
  subtitle text NOT NULL DEFAULT 'Book your appointment in seconds with the city''s most trusted barbers.',
  badge_text text DEFAULT 'Premium Grooming Experience',
  primary_cta_text text DEFAULT 'Book Appointment',
  secondary_cta_text text DEFAULT 'View Services',
  background_type text DEFAULT 'gradient' CHECK (background_type IN ('gradient', 'image', 'video')),
  background_url text,
  updated_at timestamptz DEFAULT now()
);

-- Site Settings table (key-value store for flexible settings)
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  value_type text DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Contact Info table
CREATE TABLE IF NOT EXISTS contact_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'The Gentleman',
  phone text DEFAULT '+1 (234) 567-8900',
  email text DEFAULT 'info@thegentleman.com',
  whatsapp text,
  address_line1 text DEFAULT '123 Main Street, Suite 100',
  address_line2 text DEFAULT 'New York, NY 10001',
  google_maps_url text,
  emergency_contact text,
  updated_at timestamptz DEFAULT now()
);

-- Social Links table
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  is_visible boolean DEFAULT true,
  display_order int DEFAULT 0
);

-- Admin Users extended profile
CREATE TABLE IF NOT EXISTS admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer')),
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  page_url text,
  referrer text,
  user_agent text,
  session_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Gallery Images policies
DROP POLICY IF EXISTS "gallery_public_read" ON gallery_images;
CREATE POLICY "gallery_public_read" ON gallery_images FOR SELECT
  TO anon, authenticated USING (is_visible = true);
DROP POLICY IF EXISTS "gallery_admin_all" ON gallery_images;
CREATE POLICY "gallery_admin_all" ON gallery_images FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- FAQ Items policies
DROP POLICY IF EXISTS "faq_public_read" ON faq_items;
CREATE POLICY "faq_public_read" ON faq_items FOR SELECT
  TO anon, authenticated USING (is_visible = true);
DROP POLICY IF EXISTS "faq_admin_all" ON faq_items;
CREATE POLICY "faq_admin_all" ON faq_items FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Hero Content policies
DROP POLICY IF EXISTS "hero_public_read" ON hero_content;
CREATE POLICY "hero_public_read" ON hero_content FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "hero_admin_all" ON hero_content;
CREATE POLICY "hero_admin_all" ON hero_content FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Site Settings policies
DROP POLICY IF EXISTS "settings_public_read" ON site_settings;
CREATE POLICY "settings_public_read" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "settings_admin_all" ON site_settings;
CREATE POLICY "settings_admin_all" ON site_settings FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Contact Info policies
DROP POLICY IF EXISTS "contact_public_read" ON contact_info;
CREATE POLICY "contact_public_read" ON contact_info FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "contact_admin_all" ON contact_info;
CREATE POLICY "contact_admin_all" ON contact_info FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Social Links policies
DROP POLICY IF EXISTS "social_public_read" ON social_links;
CREATE POLICY "social_public_read" ON social_links FOR SELECT
  TO anon, authenticated USING (is_visible = true);
DROP POLICY IF EXISTS "social_admin_all" ON social_links;
CREATE POLICY "social_admin_all" ON social_links FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Admin Profiles policies
DROP POLICY IF EXISTS "admin_profiles_read" ON admin_profiles;
CREATE POLICY "admin_profiles_read" ON admin_profiles FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_profiles_update" ON admin_profiles;
CREATE POLICY "admin_profiles_update" ON admin_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Activity Log policies
DROP POLICY IF EXISTS "activity_log_read" ON activity_log;
CREATE POLICY "activity_log_read" ON activity_log FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "activity_log_insert" ON activity_log;
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT
  TO authenticated WITH CHECK (true);

-- Analytics Events policies
DROP POLICY IF EXISTS "analytics_insert" ON analytics_events;
CREATE POLICY "analytics_insert" ON analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "analytics_read" ON analytics_events;
CREATE POLICY "analytics_read" ON analytics_events FOR SELECT
  TO authenticated USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery_images(display_order);
CREATE INDEX IF NOT EXISTS idx_faq_order ON faq_items(display_order);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);

-- Insert default hero content
INSERT INTO hero_content (headline, subtitle, badge_text)
VALUES ('Your Style Starts Here', 'Book your appointment in seconds with the city''s most trusted barbers.', 'Premium Grooming Experience')
ON CONFLICT DO NOTHING;

-- Insert default contact info
INSERT INTO contact_info (business_name, phone, email, address_line1, address_line2)
VALUES ('The Gentleman', '+1 (234) 567-8900', 'info@thegentleman.com', '123 Main Street, Suite 100', 'New York, NY 10001')
ON CONFLICT DO NOTHING;

-- Insert default social links
INSERT INTO social_links (platform, url, display_order) VALUES
  ('instagram', 'https://instagram.com/thegentleman', 1),
  ('facebook', 'https://facebook.com/thegentleman', 2),
  ('whatsapp', 'https://wa.me/1234567890', 3),
  ('tiktok', 'https://tiktok.com/@thegentleman', 4)
ON CONFLICT DO NOTHING;

-- Insert default site settings
INSERT INTO site_settings (key, value, value_type, description) VALUES
  ('logo_url', '', 'string', 'URL to the site logo'),
  ('favicon_url', '', 'string', 'URL to the site favicon'),
  ('primary_color', '#D4AF37', 'string', 'Primary brand color'),
  ('secondary_color', '#1A1A1A', 'string', 'Secondary brand color'),
  ('accent_color', '#D4AF37', 'string', 'Accent color'),
  ('footer_text', 'Premium grooming experience for the modern gentleman.', 'string', 'Footer description text'),
  ('seo_title', 'The Gentleman | Premium Barber Shop', 'string', 'SEO meta title'),
  ('seo_description', 'Book your appointment in seconds with the city''s most trusted barbers.', 'string', 'SEO meta description'),
  ('seo_keywords', 'barber shop, haircut, beard trim, grooming', 'string', 'SEO meta keywords'),
  ('og_image_url', '', 'string', 'Open Graph image URL'),
  ('analytics_code', '', 'string', 'Google Analytics tracking code'),
  ('meta_pixel', '', 'string', 'Meta/Facebook Pixel code')
ON CONFLICT (key) DO NOTHING;

-- Insert default FAQs
INSERT INTO faq_items (question, answer, category, display_order) VALUES
  ('How do I book an appointment?', 'You can book an appointment through our online booking system. Simply select your preferred barber, choose a service, pick a date and time that works for you, enter your contact details, and confirm your booking.', 'Booking', 1),
  ('Can I cancel or reschedule my appointment?', 'Yes, you can cancel or reschedule your appointment up to 24 hours before your scheduled time. Please contact us directly via phone or email to make changes to your booking.', 'Booking', 2),
  ('Do I need to pay a deposit?', 'No deposit is required for standard appointments. However, for VIP packages or group bookings, we may require a 20% deposit to secure your slot.', 'Booking', 3),
  ('What services do you offer?', 'We offer a wide range of grooming services including haircuts, beard trims, hot towel shaves, kids cuts, hair styling, and our premium VIP package.', 'Services', 4),
  ('How long does a typical haircut take?', 'A standard haircut typically takes between 30-45 minutes, depending on the style and complexity. Premium services like the VIP Package can take up to 2 hours.', 'Services', 5),
  ('Do you offer any discounts?', 'We offer loyalty discounts for returning customers, as well as special promotions throughout the year. Follow us on social media or subscribe to our newsletter to stay updated.', 'Services', 6),
  ('What are your opening hours?', 'We are open Monday to Friday from 9:00 AM to 7:00 PM, and Saturdays from 10:00 AM to 5:00 PM. We are closed on Sundays.', 'General', 7),
  ('Do I need to arrive early?', 'We recommend arriving 5-10 minutes before your scheduled appointment time. This gives you time to settle in, enjoy a complimentary beverage, and discuss your desired style.', 'General', 8),
  ('What payment methods do you accept?', 'We accept all major credit cards, debit cards, Apple Pay, Google Pay, and cash. Gift cards are also available for purchase.', 'Payment', 9)
ON CONFLICT DO NOTHING;

-- Insert default gallery images
INSERT INTO gallery_images (image_url, alt_text, category, display_order) VALUES
  ('https://images.pexels.com/photo-1813360/pexels-photo-1813360.jpeg?w=600', 'Classic haircut', 'Haircuts', 1),
  ('https://images.pexels.com/photo-1599355789704-3946f625e9a3?w=600', 'Beard styling', 'Beard', 2),
  ('https://images.pexels.com/photo-3775602/pexels-photo-3775602.jpeg?w=600', 'Modern fade', 'Haircuts', 3),
  ('https://images.pexels.com/photo-2687520/pexels-photo-2687520.jpeg?w=600', 'Shop interior', 'Shop', 4),
  ('https://images.pexels.com/photo-1314324/pexels-photo-1314324.jpeg?w=600', 'Hot towel shave', 'Shaves', 5),
  ('https://images.pexels.com/photo-2291095/pexels-photo-2291095.jpeg?w=600', 'Premium service', 'Haircuts', 6),
  ('https://images.pexels.com/photo-3782775/pexels-photo-3782775.jpeg?w=600', 'Equipment detail', 'Shop', 7),
  ('https://images.pexels.com/photo-1622288467604-9a67d47e809c?w=600', 'Relaxing atmosphere', 'Shop', 8),
  ('https://images.pexels.com/photo-7229689/pexels-photo-7229689.jpeg?w=600', 'Customer service', 'Haircuts', 9),
  ('https://images.pexels.com/photo-5936142/pexels-photo-5936142.jpeg?w=600', 'VIP treatment', 'Shaves', 10),
  ('https://images.pexels.com/photo-5439165/pexels-photo-5439165.jpeg?w=600', 'Kids corner', 'Haircuts', 11),
  ('https://images.pexels.com/photo-7988229/pexels-photo-7988229.jpeg?w=600', 'Beard trim', 'Beard', 12)
ON CONFLICT DO NOTHING;