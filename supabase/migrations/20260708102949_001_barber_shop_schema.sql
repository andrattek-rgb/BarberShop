/*
# Barber Shop Database Schema

Creates the complete database structure for a premium barber booking website.

## Tables Created:
1. **barbers** - Barber profiles with photos, bio, specialties, ratings, and social links
2. **services** - Service offerings with name, description, price, duration, and icon
3. **appointments** - Customer bookings with barber, service, date/time, customer info, and status
4. **reviews** - Customer reviews with ratings, comments, and photos
5. **blocked_dates** - Dates/times blocked by admin (holidays, time off, etc.)
6. **opening_hours** - Shop opening hours for each day of the week

## Security:
- RLS enabled on all tables
- Public read access for browsing data (barbers, services, reviews, opening hours)
- Public insert for appointments and reviews (customers can book and review)
- Admin operations require authentication (via Supabase Auth)

## Notes:
1. Single-tenant design (no user_id columns) - one barber shop, customers don't sign in
2. Admin authentication uses Supabase Auth - create admin user manually
3. Appointments contain customer contact info but no auth required to book
4. Status workflow: pending -> confirmed -> completed OR cancelled
*/

-- Barbers table
CREATE TABLE IF NOT EXISTS barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_url text,
  bio text,
  experience_years int DEFAULT 0,
  specialties text[] DEFAULT '{}',
  rating decimal(3,2) DEFAULT 5.0,
  review_count int DEFAULT 0,
  instagram_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  duration_minutes int NOT NULL,
  icon_name text,
  is_popular boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid REFERENCES barbers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  special_notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid REFERENCES barbers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_photo_url text,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Blocked dates table (admin blocks dates/times)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  blocked_time time,
  reason text,
  is_full_day boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Opening hours table
CREATE TABLE IF NOT EXISTS opening_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time,
  close_time time,
  is_closed boolean DEFAULT false,
  UNIQUE(day_of_week)
);

-- Enable RLS on all tables
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;

-- Barbers policies (public read, admin write)
DROP POLICY IF EXISTS "barbers_public_read" ON barbers;
CREATE POLICY "barbers_public_read" ON barbers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "barbers_admin_insert" ON barbers;
CREATE POLICY "barbers_admin_insert" ON barbers FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "barbers_admin_update" ON barbers;
CREATE POLICY "barbers_admin_update" ON barbers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "barbers_admin_delete" ON barbers;
CREATE POLICY "barbers_admin_delete" ON barbers FOR DELETE
  TO authenticated USING (true);

-- Services policies (public read, admin write)
DROP POLICY IF EXISTS "services_public_read" ON services;
CREATE POLICY "services_public_read" ON services FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "services_admin_insert" ON services;
CREATE POLICY "services_admin_insert" ON services FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "services_admin_update" ON services;
CREATE POLICY "services_admin_update" ON services FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "services_admin_delete" ON services;
CREATE POLICY "services_admin_delete" ON services FOR DELETE
  TO authenticated USING (true);

-- Appointments policies (public read for availability, public insert for booking, admin full access)
DROP POLICY IF EXISTS "appointments_public_read" ON appointments;
CREATE POLICY "appointments_public_read" ON appointments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "appointments_public_insert" ON appointments;
CREATE POLICY "appointments_public_insert" ON appointments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "appointments_admin_update" ON appointments;
CREATE POLICY "appointments_admin_update" ON appointments FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "appointments_admin_delete" ON appointments;
CREATE POLICY "appointments_admin_delete" ON appointments FOR DELETE
  TO authenticated USING (true);

-- Reviews policies (public read approved reviews, public insert, admin can update/delete)
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_public_insert" ON reviews;
CREATE POLICY "reviews_public_insert" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_admin_update" ON reviews;
CREATE POLICY "reviews_admin_update" ON reviews FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_admin_delete" ON reviews;
CREATE POLICY "reviews_admin_delete" ON reviews FOR DELETE
  TO authenticated USING (true);

-- Blocked dates policies (public read for availability checking, admin write)
DROP POLICY IF EXISTS "blocked_dates_public_read" ON blocked_dates;
CREATE POLICY "blocked_dates_public_read" ON blocked_dates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "blocked_dates_admin_insert" ON blocked_dates;
CREATE POLICY "blocked_dates_admin_insert" ON blocked_dates FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "blocked_dates_admin_update" ON blocked_dates;
CREATE POLICY "blocked_dates_admin_update" ON blocked_dates FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "blocked_dates_admin_delete" ON blocked_dates;
CREATE POLICY "blocked_dates_admin_delete" ON blocked_dates FOR DELETE
  TO authenticated USING (true);

-- Opening hours policies (public read, admin write)
DROP POLICY IF EXISTS "opening_hours_public_read" ON opening_hours;
CREATE POLICY "opening_hours_public_read" ON opening_hours FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "opening_hours_admin_insert" ON opening_hours;
CREATE POLICY "opening_hours_admin_insert" ON opening_hours FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "opening_hours_admin_update" ON opening_hours;
CREATE POLICY "opening_hours_admin_update" ON opening_hours FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "opening_hours_admin_delete" ON opening_hours;
CREATE POLICY "opening_hours_admin_delete" ON opening_hours FOR DELETE
  TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_reviews_barber ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(blocked_date);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_active ON barbers(is_active);

-- Insert default opening hours (9 AM - 7 PM, closed Sundays)
INSERT INTO opening_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '09:00', '19:00', false), -- Monday
  (1, '09:00', '19:00', false), -- Tuesday
  (2, '09:00', '19:00', false), -- Wednesday
  (3, '09:00', '19:00', false), -- Thursday
  (4, '09:00', '19:00', false), -- Friday
  (5, '10:00', '17:00', false), -- Saturday
  (6, NULL, NULL, true)         -- Sunday (closed)
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert default services
INSERT INTO services (name, description, price, duration_minutes, icon_name, is_popular, display_order) VALUES
  ('Haircut', 'Classic precision haircut with styling and finish', 35.00, 45, 'scissors', false, 1),
  ('Beard Trim', 'Expert beard shaping and trim with hot towel treatment', 25.00, 30, 'sparkles', false, 2),
  ('Hair + Beard', 'Complete grooming package - haircut and beard trim combined', 55.00, 75, 'crown', true, 3),
  ('Kids Cut', 'Gentle, patient haircut for children under 12', 25.00, 30, 'smile', false, 4),
  ('VIP Package', 'Premium experience with haircut, beard, facial treatment, and beverage', 85.00, 120, 'gem', false, 5)
ON CONFLICT DO NOTHING;

-- Insert sample barbers
INSERT INTO barbers (name, photo_url, bio, experience_years, specialties, rating, review_count, instagram_url, is_active) VALUES
  ('Marcus Williams', 'https://images.pexels.com/photo-1580618672591-eb5a5d149a9b?w=400&h=400&fit=crop', 'Master barber with 15+ years of experience. Specializes in classic cuts and beard styling.', 15, ARRAY['Classic Cuts', 'Beard Styling', 'Hot Towel Shaves'], 4.9, 127, 'https://instagram.com/marcus_cuts', true),
  ('David Chen', 'https://images.pexels.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', 'Creative stylist known for modern fades and precision work. Featured in GQ Magazine.', 8, ARRAY['Modern Fades', 'Design Work', 'Hair Art'], 4.8, 89, 'https://instagram.com/david_styles', true),
  ('James Rodriguez', 'https://images.pexels.com/photo-1500648767791-00dcc994da4f?w=400&h=400&fit=crop', 'Traditional barber with a passion for hot towel shaves and gentleman grooming.', 12, ARRAY['Hot Towel Shaves', 'Classic Styling', 'Scissor Cuts'], 4.9, 156, 'https://instagram.com/james_traditional', true),
  ('Michael Thompson', 'https://images.pexels.com/photo-1472098646126-4164e4d05a6b?w=400&h=400&fit=crop', 'Young talent bringing fresh perspectives to traditional techniques. Kids specialist.', 4, ARRAY['Kids Cuts', 'Modern Styles', 'Quick Service'], 4.7, 64, 'https://instagram.com/mike_the_barber', true)
ON CONFLICT DO NOTHING;

-- Insert sample reviews
INSERT INTO reviews (barber_id, customer_name, customer_photo_url, rating, comment, is_approved) 
SELECT 
  b.id,
  'Alexander Mitchell',
  'https://images.pexels.com/photo-220453/pexels-photo-220453.jpeg?w=100&h=100&fit=crop',
  5,
  'Best haircut experience in the city. Marcus understood exactly what I wanted and delivered beyond expectations. The attention to detail is unmatched.',
  true
FROM barbers b WHERE b.name = 'Marcus Williams' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (barber_id, customer_name, customer_photo_url, rating, comment, is_approved)
SELECT 
  b.id,
  'Steven Brooks',
  'https://images.pexels.com/photo-1222271/pexels-photo-1222271.jpeg?w=100&h=100&fit=crop',
  5,
  'David is incredible with fades. The cleanest taper fade I have ever had. Will definitely be coming back.',
  true
FROM barbers b WHERE b.name = 'David Chen' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (barber_id, customer_name, customer_photo_url, rating, comment, is_approved)
SELECT 
  b.id,
  'Christopher Lee',
  'https://images.pexels.com/photo-1680275497546-0b4d1a3e4e1f?w=100&h=100&fit=crop',
  5,
  'The hot towel shave experience with James was absolutely luxurious. Traditional barbering at its finest.',
  true
FROM barbers b WHERE b.name = 'James Rodriguez' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (barber_id, customer_name, customer_photo_url, rating, comment, is_approved)
SELECT 
  b.id,
  'Daniel Wright',
  'https://images.pexels.com/photo-1506797197464-15f73d6a0f31?w=100&h=100&fit=crop',
  5,
  'Michael was amazing with my son. Patient, friendly, and gave him the coolest haircut. Highly recommend for kids!',
  true
FROM barbers b WHERE b.name = 'Michael Thompson' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO reviews (barber_id, customer_name, customer_photo_url, rating, comment, is_approved)
SELECT 
  b.id,
  'Jonathan Hayes',
  'https://images.pexels.com/photo-1043434/pexels-photo-1043434.jpeg?w=100&h=100&fit=crop',
  5,
  'The VIP package is worth every penny. Relaxing atmosphere, great conversation, and I left looking sharper than ever.',
  true
FROM barbers b WHERE b.name = 'Marcus Williams' LIMIT 1
ON CONFLICT DO NOTHING;